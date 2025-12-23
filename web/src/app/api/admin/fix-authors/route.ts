// src/app/api/admin/fix-authors/route.ts
import { withAdminAuth } from '@/lib/admin-middleware'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'

// POST - Fix author ID mismatches with specified user ID
export const POST = withAdminAuth(async (session, request: Request) => {

  // Only admins can run this

  const { userId } = await request.json()

  if (!userId || typeof userId !== 'string') {
    return errorResponse('User ID is required', 400, 'VALIDATION_ERROR')
  }

  const results = {
    diagnosis: {} as any,
    fix: {} as any,
  }

  try {
    // 1. Verify the selected user exists
    const selectedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isWriter: true,
        writerName: true,
      }
    })

    if (!selectedUser) {
      return errorResponse('Selected user not found', 404, 'USER_NOT_FOUND')
    }

    results.fix.selectedUser = selectedUser

    // 2. Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isWriter: true,
        writerName: true,
      }
    })

    results.diagnosis.totalUsers = users.length

    // 3. Get all novels
    const novels = await prisma.novel.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        authorId: true,
        authorName: true,
      }
    })

    results.diagnosis.totalNovels = novels.length

    // 4. Find novels with invalid author IDs
    const invalidNovels = novels.filter((novel: any) =>
      !users.find((u: any) => u.id === novel.authorId)
    )

    results.diagnosis.invalidNovels = invalidNovels.length
    results.diagnosis.invalidNovelsList = invalidNovels

    if (invalidNovels.length === 0) {
      results.fix.message = 'All novels have valid author IDs. Nothing to fix.'
      return successResponse(results)
    }

    // 5. Update all invalid novels
    const updateResults = []
    for (const novel of invalidNovels) {
      try {
        await prisma.novel.update({
          where: { id: novel.id },
          data: {
            authorId: selectedUser.id,
            authorName: selectedUser.writerName || selectedUser.name || 'ButterNovel Official'
          }
        })
        updateResults.push({
          id: novel.id,
          title: novel.title,
          status: 'updated',
          oldAuthorId: novel.authorId,
          newAuthorId: selectedUser.id
        })
      } catch (error: any) {
        updateResults.push({
          id: novel.id,
          title: novel.title,
          status: 'failed',
          error: error.message
        })
      }
    }

    results.fix.updateResults = updateResults
    results.fix.successCount = updateResults.filter(r => r.status === 'updated').length
    results.fix.failedCount = updateResults.filter(r => r.status === 'failed').length

    return successResponse(results)
  } catch (error: any) {
    return errorResponse(
      `Failed to fix authors: ${error.message}`,
      500,
      'INTERNAL_ERROR'
    )
  }
})

// GET - Diagnose only (no changes)
export const GET = withAdminAuth(async (session) => {

  // Only admins can run this

  try {
    // 1. Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isWriter: true,
        writerName: true,
      }
    })

    // 2. Get all novels
    const novels = await prisma.novel.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        authorId: true,
        authorName: true,
      }
    })

    // 3. Find novels with invalid author IDs
    const invalidNovels = novels.filter((novel: any) =>
      !users.find((u: any) => u.id === novel.authorId)
    )

    // 4. Find admin/butterpicks user
    const adminUser = users.find((u: any) =>
      u.email.includes('admin') ||
      u.writerName === 'ButterNovel Official' ||
      u.name?.toLowerCase().includes('butterpicks')
    )

    return successResponse({
      totalUsers: users.length,
      totalNovels: novels.length,
      invalidNovels: invalidNovels.length,
      users: users.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        writerName: u.writerName
      })),
      invalidNovelsList: invalidNovels.map((n: any) => ({
        id: n.id,
        title: n.title,
        authorId: n.authorId,
        authorName: n.authorName
      })),
      suggestedAdmin: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        writerName: adminUser.writerName
      } : null
    })
  } catch (error: any) {
    return errorResponse(
      `Failed to diagnose: ${error.message}`,
      500,
      'INTERNAL_ERROR'
    )
  }
})
