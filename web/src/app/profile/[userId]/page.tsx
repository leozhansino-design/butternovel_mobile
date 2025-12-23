import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import PublicUserProfile from '@/components/profile/PublicUserProfile'

interface PageProps {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { userId } = await params

  try {
    const user = await withRetry(
      () => prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
      { operationName: 'Get user for metadata' }
    ) as any

    return {
      title: `${user?.name || 'User'}'s Profile - ButterNovel`,
      description: `View ${user?.name || 'user'}'s profile and activity`,
    }
  } catch (error) {
    console.error('[Profile Metadata] Error fetching user:', error)
    return {
      title: 'User Profile - ButterNovel',
      description: 'View user profile and activity',
    }
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { userId } = await params

  try {
    // 🔧 FIX: Parallelize all database queries to reduce connection time
    // Previously: Sequential queries causing connection pool exhaustion
    // Now: All queries run in parallel, using only 4 connections simultaneously
    const [user, booksReadRecords, followCounts] = (await Promise.all([
      // Query 1: Get user data
      withRetry(
        () => prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
            role: true,
            contributionPoints: true,
            level: true,
            isOfficial: true,
            totalReadingTime: true,
            libraryPrivacy: true,
            createdAt: true,
            _count: {
              select: {
                library: true,
                ratings: true,
              },
            },
          },
        }),
        { operationName: 'Get user profile' }
      ),

      // Query 2: Get books read count
      // 🔧 FIX: Limit reading history to prevent fetching thousands of records
      // Use count with distinct instead of findMany for better performance
      withRetry(
        // @ts-ignore - Prisma groupBy type inference issue
        () => prisma.readingHistory.groupBy({
          by: ['novelId'],
          where: { userId },
          _count: { novelId: true },
        }),
        { operationName: 'Get books read count' }
      ) as Promise<any[]>,

      // Query 3: Get follow counts (with error handling)
      (async () => {
        try {
          const [followingCount, followersCount] = await Promise.all([
            withRetry(
              () => prisma.follow.count({ where: { followerId: userId } }),
              { operationName: 'Get following count' }
            ),
            withRetry(
              () => prisma.follow.count({ where: { followingId: userId } }),
              { operationName: 'Get followers count' }
            ),
          ])
          return { following: followingCount, followers: followersCount }
        } catch (error) {
          // Follow table doesn't exist yet or error occurred
          console.warn('[Profile] Follow counts unavailable:', error)
          return { following: 0, followers: 0 }
        }
      })(),
    ])) as [any, any[], { following: number; followers: number }]

    if (!user) {
      notFound()
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-amber-50">
        <PublicUserProfile
          user={{
            ...user,
            stats: {
              booksRead: booksReadRecords.length,
              following: followCounts.following,
              followers: followCounts.followers,
              totalRatings: user._count.ratings,
              readingTime: user.totalReadingTime,
            },
          }}
        />
      </div>
    )
  } catch (error: unknown) {
    // 🔧 FIX: Better error logging for debugging profile issues
    console.error('[Profile Page] Error loading profile:', {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Check for specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string }
      if (dbError.code === 'P1001') {
        console.error('[Profile Page] Database connection failed - max connections may be reached')
      } else if (dbError.code === 'P1008') {
        console.error('[Profile Page] Database operation timed out')
      }
    }

    // Re-throw to show error page
    throw error
  }
}
