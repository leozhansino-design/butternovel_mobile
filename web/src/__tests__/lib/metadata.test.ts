/**
 * SEO 元数据生成测试
 * 测试 Open Graph、Twitter Cards、结构化数据
 */

import {
  generateNovelMetadata,
  generateChapterMetadata,
  generateCategoryMetadata,
  generateSearchMetadata,
  generateNovelJsonLd,
} from '@/lib/metadata'

// Mock the metadata module to use test URL
jest.mock('@/lib/metadata', () => {
  const originalModule = jest.requireActual('@/lib/metadata')
  // Can't easily mock the baseUrl const, so tests will use default
  return originalModule
})

describe('metadata', () => {
  // Note: NEXT_PUBLIC_SITE_URL is read at import time, so we use default
  const baseUrl = 'https://butternovel.com' // 使用默认值

  describe('generateNovelMetadata()', () => {
    it('should generate complete novel metadata', () => {
      const metadata = generateNovelMetadata({
        title: 'The Truth Switch',
        blurb: 'A thrilling story about truth and lies',
        coverImage: 'https://example.com/cover.jpg',
        authorName: 'John Doe',
        categoryName: 'Fantasy',
        slug: 'the-truth-switch',
      })

      expect(metadata.title).toBe('The Truth Switch')
      expect(metadata.description).toBe('A thrilling story about truth and lies')
      expect(metadata.keywords).toContain('The Truth Switch')
      expect(metadata.keywords).toContain('John Doe')
      expect(metadata.authors).toEqual([{ name: 'John Doe' }])
    })

    it('should truncate long blurb', () => {
      const longBlurb = 'A'.repeat(200)
      const metadata = generateNovelMetadata({
        title: 'Test',
        blurb: longBlurb,
        authorName: 'Author',
        categoryName: 'Fantasy',
        slug: 'test',
      })

      expect(metadata.description).toHaveLength(160) // 157 + '...'
      expect(metadata.description?.endsWith('...')).toBe(true)
    })

    it('should use default cover image when not provided', () => {
      const metadata = generateNovelMetadata({
        title: 'Test',
        blurb: 'Test blurb',
        authorName: 'Author',
        categoryName: 'Fantasy',
        slug: 'test',
      })

      expect(metadata.openGraph?.images?.[0]?.url).toBe(`${baseUrl}/og-image.png`)
    })

    it('should generate correct canonical URL', () => {
      const metadata = generateNovelMetadata({
        title: 'Test',
        blurb: 'Test',
        authorName: 'Author',
        categoryName: 'Fantasy',
        slug: 'test-novel',
      })

      expect(metadata.alternates?.canonical).toBe(`${baseUrl}/novels/test-novel`)
    })
  })

  describe('generateChapterMetadata()', () => {
    it('should generate chapter metadata', () => {
      const metadata = generateChapterMetadata({
        novelTitle: 'The Truth Switch',
        chapterTitle: 'The Beginning',
        chapterNumber: 1,
        novelSlug: 'the-truth-switch',
        chapterId: 123,
        authorName: 'John Doe',
      })

      expect(metadata.title).toContain('Chapter 1')
      expect(metadata.title).toContain('The Beginning')
      expect(metadata.title).toContain('The Truth Switch')
      expect(metadata.description).toContain('John Doe')
    })
  })

  describe('generateCategoryMetadata()', () => {
    it('should generate category metadata', () => {
      const metadata = generateCategoryMetadata({
        categoryName: 'Fantasy',
        categorySlug: 'fantasy',
        novelCount: 150,
      })

      expect(metadata.title).toContain('Fantasy')
      expect(metadata.description).toContain('150')
      expect(metadata.description).toContain('Fantasy')
    })

    it('should work without novel count', () => {
      const metadata = generateCategoryMetadata({
        categoryName: 'Fantasy',
        categorySlug: 'fantasy',
      })

      expect(metadata.title).toBe('Fantasy Novels')
      expect(metadata.description).toBeTruthy()
    })
  })

  describe('generateSearchMetadata()', () => {
    it('should generate search metadata with query', () => {
      const metadata = generateSearchMetadata('the truth')

      expect(metadata.title).toContain('the truth')
      expect(metadata.description).toContain('the truth')
      expect(metadata.robots?.index).toBe(false) // 不索引搜索结果
    })

    it('should generate search metadata without query', () => {
      const metadata = generateSearchMetadata()

      expect(metadata.title).toBe('Search Novels')
      expect(metadata.robots?.index).toBe(true)
    })
  })

  describe('generateNovelJsonLd()', () => {
    it('should generate JSON-LD for novel', () => {
      const jsonLd = generateNovelJsonLd({
        title: 'The Truth Switch',
        blurb: 'A story',
        coverImage: 'https://example.com/cover.jpg',
        authorName: 'John Doe',
        categoryName: 'Fantasy',
        slug: 'the-truth-switch',
        averageRating: 8.5,
        totalRatings: 100,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      })

      expect(jsonLd['@context']).toBe('https://schema.org')
      expect(jsonLd['@type']).toBe('Book')
      expect(jsonLd.name).toBe('The Truth Switch')
      expect(jsonLd.author).toEqual({ '@type': 'Person', name: 'John Doe' })
      expect(jsonLd.aggregateRating).toBeDefined()
      expect(jsonLd.aggregateRating?.ratingValue).toBe(8.5)
    })

    it('should work without ratings', () => {
      const jsonLd = generateNovelJsonLd({
        title: 'Test',
        blurb: 'Test',
        authorName: 'Author',
        categoryName: 'Fantasy',
        slug: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      expect(jsonLd.aggregateRating).toBeUndefined()
    })
  })
})
