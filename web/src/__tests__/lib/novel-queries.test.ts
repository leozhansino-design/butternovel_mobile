/**
 * Novel Queries 测试
 * 测试小说标题重复检查功能
 */

import { checkNovelTitleExists, validateNovelTitleUnique } from '@/lib/novel-queries'
import { prisma } from '@/lib/prisma'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    novel: {
      findFirst: jest.fn(),
    },
  },
}))

// Mock db-retry to execute immediately
jest.mock('@/lib/db-retry', () => ({
  withRetry: jest.fn((fn) => fn()),
}))

describe('novel-queries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('checkNovelTitleExists', () => {
    it('should return true when a novel with the same title exists', async () => {
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue({ id: 1 })

      const result = await checkNovelTitleExists('Existing Novel')

      expect(result).toBe(true)
      expect(prisma.novel.findFirst).toHaveBeenCalledWith({
        where: {
          title: {
            equals: 'Existing Novel',
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })
    })

    it('should return false when no novel with the same title exists', async () => {
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await checkNovelTitleExists('New Novel')

      expect(result).toBe(false)
    })

    it('should exclude specified novelId when checking', async () => {
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue(null)

      await checkNovelTitleExists('Test Novel', 123)

      expect(prisma.novel.findFirst).toHaveBeenCalledWith({
        where: {
          title: {
            equals: 'Test Novel',
            mode: 'insensitive',
          },
          NOT: { id: 123 },
        },
        select: { id: true },
      })
    })

    it('should trim whitespace from title before checking', async () => {
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue(null)

      await checkNovelTitleExists('  Title with spaces  ')

      expect(prisma.novel.findFirst).toHaveBeenCalledWith({
        where: {
          title: {
            equals: 'Title with spaces',
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })
    })

    it('should perform case-insensitive matching', async () => {
      // Mock returns a result regardless of case
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue({ id: 1 })

      const result = await checkNovelTitleExists('MY NOVEL')

      expect(result).toBe(true)
      expect(prisma.novel.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: expect.objectContaining({
              mode: 'insensitive',
            }),
          }),
        })
      )
    })

    it('should handle empty title', async () => {
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await checkNovelTitleExists('')

      expect(result).toBe(false)
      expect(prisma.novel.findFirst).toHaveBeenCalledWith({
        where: {
          title: {
            equals: '',
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })
    })

    it('should handle special characters in title', async () => {
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue({ id: 1 })

      const result = await checkNovelTitleExists('Novel: The Beginning! (Part 1)')

      expect(result).toBe(true)
      expect(prisma.novel.findFirst).toHaveBeenCalledWith({
        where: {
          title: {
            equals: 'Novel: The Beginning! (Part 1)',
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })
    })

    it('should handle Chinese characters in title', async () => {
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue({ id: 1 })

      const result = await checkNovelTitleExists('我的小说')

      expect(result).toBe(true)
      expect(prisma.novel.findFirst).toHaveBeenCalledWith({
        where: {
          title: {
            equals: '我的小说',
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })
    })

    it('should not add NOT clause when excludeNovelId is undefined', async () => {
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue(null)

      await checkNovelTitleExists('Test Novel', undefined)

      expect(prisma.novel.findFirst).toHaveBeenCalledWith({
        where: {
          title: {
            equals: 'Test Novel',
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })
    })

    it('should handle excludeNovelId of 0', async () => {
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue(null)

      await checkNovelTitleExists('Test Novel', 0)

      expect(prisma.novel.findFirst).toHaveBeenCalledWith({
        where: {
          title: {
            equals: 'Test Novel',
            mode: 'insensitive',
          },
          NOT: { id: 0 },
        },
        select: { id: true },
      })
    })
  })

  describe('validateNovelTitleUnique', () => {
    it('should not throw when title is unique', async () => {
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(validateNovelTitleUnique('Unique Title')).resolves.not.toThrow()
    })

    it('should throw when title already exists', async () => {
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue({ id: 1 })

      await expect(validateNovelTitleUnique('Existing Title')).rejects.toThrow(
        'A novel with this title already exists'
      )
    })

    it('should pass excludeNovelId to checkNovelTitleExists', async () => {
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue(null)

      await validateNovelTitleUnique('Test Title', 456)

      expect(prisma.novel.findFirst).toHaveBeenCalledWith({
        where: {
          title: {
            equals: 'Test Title',
            mode: 'insensitive',
          },
          NOT: { id: 456 },
        },
        select: { id: true },
      })
    })

    it('should allow updating novel with same title (excluded by id)', async () => {
      // When checking for update, the current novel is excluded
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(validateNovelTitleUnique('My Novel', 123)).resolves.not.toThrow()
    })

    it('should throw when another novel has the same title during update', async () => {
      // Another novel (id: 456) has the same title
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue({ id: 456 })

      await expect(validateNovelTitleUnique('Duplicate Title', 123)).rejects.toThrow(
        'A novel with this title already exists'
      )
    })
  })

  describe('edge cases', () => {
    it('should handle database errors gracefully', async () => {
      (prisma.novel.findFirst as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      await expect(checkNovelTitleExists('Test Novel')).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should handle very long titles', async () => {
      const longTitle = 'A'.repeat(200)
      ;(prisma.novel.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await checkNovelTitleExists(longTitle)

      expect(result).toBe(false)
      expect(prisma.novel.findFirst).toHaveBeenCalledWith({
        where: {
          title: {
            equals: longTitle,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })
    })

    it('should handle titles with only whitespace', async () => {
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await checkNovelTitleExists('   ')

      expect(result).toBe(false)
      expect(prisma.novel.findFirst).toHaveBeenCalledWith({
        where: {
          title: {
            equals: '',
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })
    })

    it('should handle unicode characters', async () => {
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue({ id: 1 })

      const result = await checkNovelTitleExists('小説のタイトル 📚')

      expect(result).toBe(true)
    })

    it('should handle newlines and tabs in title', async () => {
      (prisma.novel.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await checkNovelTitleExists('Title\nwith\tnewlines')

      expect(result).toBe(false)
      expect(prisma.novel.findFirst).toHaveBeenCalledWith({
        where: {
          title: {
            equals: 'Title\nwith\tnewlines',
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })
    })
  })
})
