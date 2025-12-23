// src/app/api/admin/users/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { withAdminAuth } from '@/lib/admin-middleware'

/**
 * 获取单个用户详细信息
 * GET /api/admin/users/[id]
 */
export const GET = withAdminAuth(
  async (session, request: Request, props: { params: Promise<{ id: string }> }) => {
    try {
      const params = await props.params
      const userId = params.id

      // 获取用户完整信息
      const user = await withRetry(
        () =>
          prisma.user.findUnique({
            where: { id: userId },
            include: {
              _count: {
                select: {
                  comments: true,
                  ratings: true,
                  likes: true,
                  library: true,
                  readingHistory: true,
                  ratingReplies: true,
                  ratingLikes: true,
                  forumPosts: true,
                  forumReplies: true,
                },
              },
              // 最近的活动
              comments: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  content: true,
                  createdAt: true,
                  novel: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                    },
                  },
                },
              },
              ratings: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  score: true,
                  review: true,
                  likeCount: true,
                  createdAt: true,
                  novel: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                    },
                  },
                },
              },
              library: {
                take: 10,
                orderBy: { addedAt: 'desc' },
                select: {
                  addedAt: true,
                  novel: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                      coverImage: true,
                    },
                  },
                },
              },
              readingHistory: {
                take: 10,
                orderBy: { lastReadAt: 'desc' },
                select: {
                  lastReadAt: true,
                  novel: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                    },
                  },
                  chapter: {
                    select: {
                      id: true,
                      title: true,
                      chapterNumber: true,
                    },
                  },
                },
              },
            },
          }),
        { operationName: 'Get user detail' }
      ) as any

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // 格式化响应
      const userDetail = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,

        // OAuth 信息
        googleId: user.googleId,
        facebookId: user.facebookId,
        authMethod: user.googleId
          ? 'google'
          : user.facebookId
          ? 'facebook'
          : 'email',

        // 作家信息
        isWriter: user.isWriter,
        writerName: user.writerName,
        writerBio: user.writerBio,

        // 账号状态
        isVerified: user.isVerified,
        isActive: user.isActive,
        isBanned: user.isBanned,

        // 时间戳
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,

        // 统计信息
        stats: {
          comments: user._count.comments,
          ratings: user._count.ratings,
          likes: user._count.likes,
          libraryBooks: user._count.library,
          readingHistory: user._count.readingHistory,
          replies: user._count.ratingReplies,
          ratingLikes: user._count.ratingLikes,
          forumPosts: user._count.forumPosts,
          forumReplies: user._count.forumReplies,
        },

        // 最近活动
        recentActivity: {
          comments: user.comments,
          ratings: user.ratings,
          library: user.library,
          readingHistory: user.readingHistory,
        },
      }

      return NextResponse.json({
        success: true,
        user: userDetail,
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch user detail' },
        { status: 500 }
      )
    }
  }
)
