/**
 * 标签工具测试
 * 测试标签标准化、验证、热度计算
 */

import {
  normalizeTag,
  generateTagSlug,
  isValidTag,
  normalizeTags,
  validateTags,
  calculateHotScore,
  TAG_LIMITS,
} from '@/lib/tags'

describe('tags', () => {
  describe('normalizeTag()', () => {
    it('should convert to lowercase', () => {
      expect(normalizeTag('ROMANCE')).toBe('romance')
      expect(normalizeTag('Fantasy')).toBe('fantasy')
    })

    it('should trim spaces', () => {
      expect(normalizeTag('  romance  ')).toBe('romance')
      expect(normalizeTag(' high school ')).toBe('high-school')
    })

    it('should replace spaces with hyphens', () => {
      expect(normalizeTag('high school')).toBe('high-school')
      expect(normalizeTag('young adult')).toBe('young-adult')
    })

    it('should remove special characters', () => {
      expect(normalizeTag('romance!')).toBe('romance')
      expect(normalizeTag('sci-fi@#$')).toBe('sci-fi')
    })

    it('should preserve hashtag prefix', () => {
      expect(normalizeTag('#romance')).toBe('#romance')
      expect(normalizeTag('#high school')).toBe('#high-school')
    })

    it('should handle multiple spaces', () => {
      expect(normalizeTag('high   school')).toBe('high-school')
    })

    it('should handle edge cases', () => {
      expect(normalizeTag('')).toBe('')
      expect(normalizeTag('#')).toBe('')
      expect(normalizeTag('---')).toBe('')
    })
  })

  describe('isValidTag()', () => {
    it('should accept valid tags', () => {
      expect(isValidTag('romance')).toBe(true)
      expect(isValidTag('high-school')).toBe(true)
      expect(isValidTag('#romance')).toBe(true)
      expect(isValidTag('sci-fi')).toBe(true)
    })

    it('should reject invalid tags', () => {
      expect(isValidTag('')).toBe(false)
      expect(isValidTag('high school')).toBe(false) // 包含空格
      expect(isValidTag('A'.repeat(31))).toBe(false) // 太长
      expect(isValidTag('romance!')).toBe(false) // 特殊字符
    })

    it('should respect length limits', () => {
      expect(isValidTag('a')).toBe(true)
      expect(isValidTag('a'.repeat(30))).toBe(true)
      expect(isValidTag('a'.repeat(31))).toBe(false)
    })
  })

  describe('normalizeTags()', () => {
    it('should normalize multiple tags', () => {
      const tags = ['ROMANCE', '  Fantasy  ', 'Sci-Fi!']
      const normalized = normalizeTags(tags)

      expect(normalized).toEqual(['romance', 'fantasy', 'sci-fi'])
    })

    it('should remove duplicates', () => {
      const tags = ['romance', 'ROMANCE', 'Romance']
      const normalized = normalizeTags(tags)

      expect(normalized).toEqual(['romance'])
      expect(normalized).toHaveLength(1)
    })

    it('should filter out empty tags', () => {
      const tags = ['romance', '', '   ', 'fantasy']
      const normalized = normalizeTags(tags)

      expect(normalized).toEqual(['romance', 'fantasy'])
    })

    it('should filter out tags exceeding length limit', () => {
      const tags = ['romance', 'a'.repeat(31), 'fantasy']
      const normalized = normalizeTags(tags)

      expect(normalized).toEqual(['romance', 'fantasy'])
    })
  })

  describe('validateTags()', () => {
    it('should validate correct tags', () => {
      const tags = ['romance', 'fantasy', 'sci-fi']
      const result = validateTags(tags)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject too many tags', () => {
      const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`)
      const result = validateTags(tags)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('最多只能添加20个标签')
    })

    it('should reject invalid tags', () => {
      const tags = ['romance', 'high school', 'fantasy']
      const result = validateTags(tags)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('无效的标签'))).toBe(true)
    })

    it('should reject duplicate tags', () => {
      const tags = ['romance', 'romance']
      const result = validateTags(tags)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('存在重复的标签')
    })
  })

  describe('calculateHotScore()', () => {
    it('should calculate hot score correctly', () => {
      const novel = {
        viewCount: 1000,
        bookmarkCount: 50,
        totalChapters: 30,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      }

      const score = calculateHotScore(novel)

      // 1000*0.1 + 50*5 + 30*2 - 10*0.5 - 1*1 = 100 + 250 + 60 - 5 - 1 = 404
      expect(score).toBeCloseTo(404, 0)
    })

    it('should never return negative score', () => {
      const oldNovel = {
        viewCount: 0,
        bookmarkCount: 0,
        totalChapters: 0,
        createdAt: new Date(Date.now() - 1000 * 24 * 60 * 60 * 1000), // 1000 days ago
        updatedAt: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000), // 500 days ago
      }

      const score = calculateHotScore(oldNovel)
      expect(score).toBeGreaterThanOrEqual(0)
    })

    it('should handle missing totalChapters', () => {
      const novel = {
        viewCount: 100,
        bookmarkCount: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const score = calculateHotScore(novel)
      expect(score).toBeGreaterThan(0)
    })
  })

  describe('TAG_LIMITS', () => {
    it('should have correct limits', () => {
      expect(TAG_LIMITS.MAX_TAGS).toBe(20)
      expect(TAG_LIMITS.MAX_TAG_LENGTH).toBe(30)
      expect(TAG_LIMITS.MIN_TAG_LENGTH).toBe(1)
    })
  })

  describe('generateTagSlug()', () => {
    it('should generate slug same as normalizeTag', () => {
      const testCases = ['Romance', 'High School', '#fantasy', 'sci-fi!']

      testCases.forEach(tag => {
        expect(generateTagSlug(tag)).toBe(normalizeTag(tag))
      })
    })
  })
})
