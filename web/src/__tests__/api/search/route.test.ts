/**
 * 搜索API测试套件
 * 测试所有筛选逻辑、URL参数处理、分页和排序
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/search/route'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

// Mock NextResponse.json for test environment
jest.mock('next/server', () => {
  const actualNext = jest.requireActual('next/server')
  return {
    ...actualNext,
    NextResponse: {
      ...actualNext.NextResponse,
      json: (body: any, init?: ResponseInit) => {
        const response = new Response(JSON.stringify(body), {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...init?.headers,
          },
        })
        return response
      },
    },
  }
})

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    novel: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    tag: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(),
  getIdentifier: jest.fn(() => 'test-identifier'),
}))

jest.mock('@/lib/db-retry', () => ({
  withRetry: jest.fn((fn) => fn()),
}))

describe('Search API - /api/search', () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>
  const mockRateLimit = rateLimit as jest.MockedFunction<typeof rateLimit>

  beforeEach(() => {
    jest.clearAllMocks()
    // Default: allow requests
    mockRateLimit.mockReturnValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    })
  })

  const createRequest = (params: Record<string, string> = {}) => {
    const url = new URL('http://localhost:3000/api/search')
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
    // Create a Request object and then convert to NextRequest
    const request = new Request(url.toString())
    return request as NextRequest
  }

  const mockNovel = {
    id: 1,
    title: 'Test Novel',
    slug: 'test-novel',
    blurb: 'A test novel',
    coverImage: '/cover.jpg',
    authorName: 'Test Author',
    status: 'ONGOING',
    createdAt: new Date(),
    updatedAt: new Date(),
    viewCount: 1000,
    likeCount: 100,
    bookmarkCount: 50,
    commentCount: 25,
    averageRating: 8.5,
    totalRatings: 200,
    category: {
      id: 1,
      name: 'Romance',
      slug: 'romance',
    },
    tags: [
      { id: 'tag1', name: 'CEO', slug: 'ceo' },
      { id: 'tag2', name: 'Billionaire', slug: 'billionaire' },
    ],
    _count: {
      chapters: 50,
      likes: 100,
      tags: 2, // 添加tags总数
    },
  }

  describe('✅ 1. 基础搜索功能', () => {
    it('should return all novels when no query is provided', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.novels).toHaveLength(1)
      expect(data.data.novels[0].title).toBe('Test Novel')
    })

    it('should search by title (case insensitive)', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])

      const request = createRequest({ q: 'test' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: { contains: 'test', mode: 'insensitive' },
              }),
            ]),
          }),
        })
      )
    })

    it('should search by author name', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])

      const request = createRequest({ q: 'author' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                authorName: { contains: 'author', mode: 'insensitive' },
              }),
            ]),
          }),
        })
      )
    })

    it('should search by blurb', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])

      const request = createRequest({ q: 'description' })
      const response = await GET(request)

      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                blurb: { contains: 'description', mode: 'insensitive' },
              }),
            ]),
          }),
        })
      )
    })
  })

  describe('✅ 2. 分类筛选', () => {
    it('should filter by category name or slug', async () => {
      mockPrisma.category.findFirst.mockResolvedValue({ id: 1 })
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest({ category: 'Romance' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // Implementation searches by both slug and name
      expect(mockPrisma.category.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { slug: { equals: 'Romance', mode: 'insensitive' } },
              { name: { equals: 'Romance', mode: 'insensitive' } },
            ],
          },
        })
      )
    })

    it('should filter by category ID', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest({ category: '1' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 1,
          }),
        })
      )
    })

    it('should handle non-existent category gracefully', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null)
      mockPrisma.novel.findMany.mockResolvedValue([])
      mockPrisma.novel.count.mockResolvedValue(0)

      const request = createRequest({ category: 'NonExistent' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // Should still search but with no category filter
    })
  })

  describe('✅ 3. 标签筛选（多标签AND逻辑）', () => {
    it('should filter by single tag', async () => {
      mockPrisma.tag.findMany.mockResolvedValue([{ id: 'tag1' }])
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest({ tags: 'ceo' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: { in: ['ceo'] } },
        })
      )
    })

    it('should filter by multiple tags with AND logic', async () => {
      mockPrisma.tag.findMany.mockResolvedValue([
        { id: 'tag1' },
        { id: 'tag2' },
      ])
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest({ tags: 'ceo,billionaire' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: { in: ['ceo', 'billionaire'] } },
        })
      )
      // Should use AND logic for multiple tags
      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                tags: { some: { id: 'tag1' } },
              }),
              expect.objectContaining({
                tags: { some: { id: 'tag2' } },
              }),
            ]),
          }),
        })
      )
    })

    it('should handle non-existent tags gracefully', async () => {
      mockPrisma.tag.findMany.mockResolvedValue([])
      mockPrisma.novel.findMany.mockResolvedValue([])
      mockPrisma.novel.count.mockResolvedValue(0)

      const request = createRequest({ tags: 'nonexistent' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should trim and filter empty tag slugs', async () => {
      mockPrisma.tag.findMany.mockResolvedValue([{ id: 'tag1' }])
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest({ tags: ' ceo , , billionaire ' })
      const response = await GET(request)

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: { in: ['ceo', 'billionaire'] } },
        })
      )
    })
  })

  describe('✅ 4. 状态筛选', () => {
    it('should filter by single status', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest({ status: 'completed' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['COMPLETED'] },
          }),
        })
      )
    })

    it('should filter by multiple statuses', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest({ status: 'completed,ongoing' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['COMPLETED', 'ONGOING'] },
          }),
        })
      )
    })

    it('should ignore invalid status values', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest({ status: 'completed,invalid,ongoing' })
      const response = await GET(request)

      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['COMPLETED', 'ONGOING'] },
          }),
        })
      )
    })
  })

  describe('✅ 5. 排序功能', () => {
    it('should sort by hot (default)', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.sort).toBe('hot')
      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ hotScore: 'desc' }, { viewCount: 'desc' }],
        })
      )
    })

    it('should sort by new', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest({ sort: 'new' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.sort).toBe('new')
      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: 'desc' }],
        })
      )
    })

    it('should sort by top_rated', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest({ sort: 'top_rated' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.sort).toBe('top_rated')
      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ averageRating: 'desc' }, { totalRatings: 'desc' }],
        })
      )
    })

    it('should sort by most_read', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest({ sort: 'most_read' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.sort).toBe('most_read')
      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ viewCount: 'desc' }],
        })
      )
    })

    it('should use relevance sorting when query is provided', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])

      const request = createRequest({ q: 'test', sort: 'hot' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // When query exists, should use relevance scoring instead of orderBy
      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 200, // Relevance search takes more results to rank
        })
      )
    })
  })

  describe('✅ 6. 分页功能', () => {
    it('should paginate with default values', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(100)

      const request = createRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasMore: true,
      })
    })

    it('should handle custom page and limit', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(100)

      const request = createRequest({ page: '3', limit: '10' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.pagination.page).toBe(3)
      expect(data.data.pagination.limit).toBe(10)
      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3-1) * 10
          take: 10,
        })
      )
    })

    it('should limit max results to 50', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(100)

      const request = createRequest({ limit: '100' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.pagination.limit).toBe(50) // Capped at 50
    })

    it('should calculate hasMore correctly', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(15)

      const request = createRequest({ page: '1', limit: '20' })
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.pagination.hasMore).toBe(false)
    })
  })

  describe('✅ 7. 组合筛选', () => {
    it('should combine category + tags + status filters', async () => {
      mockPrisma.category.findFirst.mockResolvedValue({ id: 1 })
      mockPrisma.tag.findMany.mockResolvedValue([
        { id: 'tag1' },
        { id: 'tag2' },
      ])
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest({
        category: 'Romance',
        tags: 'ceo,billionaire',
        status: 'completed',
        sort: 'top_rated',
      })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 1,
            status: { in: ['COMPLETED'] },
            AND: expect.any(Array),
          }),
        })
      )
    })

    it('should combine query + filters', async () => {
      mockPrisma.category.findFirst.mockResolvedValue({ id: 1 })
      mockPrisma.tag.findMany.mockResolvedValue([{ id: 'tag1' }])
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])

      const request = createRequest({
        q: 'love story',
        category: 'Romance',
        tags: 'ceo',
        status: 'completed',
      })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: { contains: 'love story', mode: 'insensitive' },
              }),
            ]),
            categoryId: 1,
            status: { in: ['COMPLETED'] },
          }),
        })
      )
    })
  })

  describe('✅ 8. URL参数处理', () => {
    it('should return filter parameters in response', async () => {
      mockPrisma.category.findFirst.mockResolvedValue({ id: 1 })
      mockPrisma.tag.findMany.mockResolvedValue([{ id: 'tag1' }])
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest({
        q: 'test',
        category: 'Romance',
        tags: 'ceo',
        status: 'completed',
        sort: 'hot',
      })
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.query).toBe('test')
      expect(data.data.category).toBe('Romance')
      expect(data.data.tags).toBe('ceo')
      expect(data.data.status).toBe('completed')
      expect(data.data.sort).toBe('hot')
    })

    it('should handle missing parameters with null', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.query).toBeNull()
      expect(data.data.category).toBeNull()
      expect(data.data.tags).toBeNull()
      expect(data.data.status).toBeNull()
    })
  })

  describe('✅ 9. 边界情况和错误处理', () => {
    it('should return empty results when no novels found', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([])
      mockPrisma.novel.count.mockResolvedValue(0)

      const request = createRequest({ q: 'nonexistent' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.novels).toHaveLength(0)
      expect(data.data.pagination.total).toBe(0)
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.novel.findMany.mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = createRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to search novels')
    })

    it('should enforce rate limiting', async () => {
      mockRateLimit.mockReturnValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 60000,
      })

      const request = createRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Too many requests')
    })

    it('should filter out unpublished and banned novels', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest()
      await GET(request)

      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
            isBanned: false,
          }),
        })
      )
    })

    it('should handle invalid page numbers', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest({ page: '-1' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Note: Current implementation passes through the parsed value directly
      // parseInt('-1') = -1, no clamping is done
      expect(data.data.pagination.page).toBe(-1)
    })
  })

  describe('✅ 10. 数据格式化', () => {
    it('should format novel data correctly', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest()
      const response = await GET(request)
      const data = await response.json()

      const novel = data.data.novels[0]
      expect(novel).toHaveProperty('id')
      expect(novel).toHaveProperty('title')
      expect(novel).toHaveProperty('slug')
      expect(novel).toHaveProperty('blurb')
      expect(novel).toHaveProperty('coverImage')
      expect(novel).toHaveProperty('authorName')
      expect(novel).toHaveProperty('status')
      expect(novel).toHaveProperty('viewCount')
      expect(novel).toHaveProperty('averageRating')
      expect(novel).toHaveProperty('totalRatings')
      expect(novel).toHaveProperty('category')
      expect(novel).toHaveProperty('tags')
      expect(novel).toHaveProperty('tagsCount')
      expect(novel).toHaveProperty('chaptersCount')
      expect(novel).toHaveProperty('likesCount')
    })

    it('should include category details', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest()
      const response = await GET(request)
      const data = await response.json()

      const category = data.data.novels[0].category
      expect(category).toHaveProperty('id')
      expect(category).toHaveProperty('name')
      expect(category).toHaveProperty('slug')
    })

    it('should limit tags to 5 per novel', async () => {
      const novelWithManyTags = {
        ...mockNovel,
        tags: Array.from({ length: 10 }, (_, i) => ({
          id: `tag${i}`,
          name: `Tag ${i}`,
          slug: `tag-${i}`,
        })),
      }
      mockPrisma.novel.findMany.mockResolvedValue([novelWithManyTags])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest()
      const response = await GET(request)
      const data = await response.json()

      // API should request only 5 tags from database
      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            tags: expect.objectContaining({
              take: 5,
            }),
          }),
        })
      )
    })

    it('should include tagsCount in response', async () => {
      const novelWith15Tags = {
        ...mockNovel,
        _count: {
          ...mockNovel._count,
          tags: 15, // 实际有15个tags
        },
      }
      mockPrisma.novel.findMany.mockResolvedValue([novelWith15Tags])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.novels[0].tagsCount).toBe(15)
      // Tags array should be limited to 5, but tagsCount shows the real total
      expect(data.data.novels[0].tags.length).toBeLessThanOrEqual(5)
    })

    it('should count tags in _count select', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([mockNovel])
      mockPrisma.novel.count.mockResolvedValue(1)

      const request = createRequest()
      await GET(request)

      // Verify that tags count is requested in the select
      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            _count: expect.objectContaining({
              select: expect.objectContaining({
                tags: true,
              }),
            }),
          }),
        })
      )
    })
  })
})
