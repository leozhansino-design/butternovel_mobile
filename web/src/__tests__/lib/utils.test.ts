/**
 * 工具函数测试
 * 测试 className 合并、slug 生成、日期格式化、文本截断
 */

import { cn, generateSlug, formatDate, truncate } from '@/lib/utils'

describe('utils', () => {
  describe('cn() - className 合并', () => {
    it('should combine multiple class names', () => {
      const result = cn('foo', 'bar', 'baz')
      expect(result).toBe('foo bar baz')
    })

    it('should filter out falsy values', () => {
      const result = cn('foo', false, null, undefined, 'bar')
      expect(result).toBe('foo bar')
    })

    it('should handle empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle all falsy values', () => {
      const result = cn(false, null, undefined)
      expect(result).toBe('')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const isDisabled = false

      const result = cn(
        'base',
        isActive && 'active',
        isDisabled && 'disabled'
      )

      expect(result).toBe('base active')
    })

    it('should handle single class', () => {
      const result = cn('single')
      expect(result).toBe('single')
    })

    it('should handle empty strings', () => {
      const result = cn('', 'foo', '', 'bar')
      expect(result).toBe('foo bar')
    })

    it('should handle real-world use case', () => {
      const size = 'lg'
      const variant = 'primary'
      const disabled = false

      const result = cn(
        'button',
        `button-${size}`,
        `button-${variant}`,
        disabled && 'button-disabled'
      )

      expect(result).toBe('button button-lg button-primary')
    })
  })

  describe('generateSlug() - URL slug 生成', () => {
    it('should convert title to lowercase slug', () => {
      const result = generateSlug('The Truth Switch')
      expect(result).toBe('the-truth-switch')
    })

    it('should replace spaces with hyphens', () => {
      const result = generateSlug('My Novel Title')
      expect(result).toBe('my-novel-title')
    })

    it('should remove special characters', () => {
      const result = generateSlug('Hello! World?')
      expect(result).toBe('hello-world')
    })

    it('should remove trailing and leading hyphens', () => {
      const result = generateSlug('---Hello World---')
      expect(result).toBe('hello-world')
    })

    it('should handle multiple consecutive special characters', () => {
      const result = generateSlug('Hello!!!World???')
      expect(result).toBe('hello-world')
    })

    it('should handle numbers', () => {
      const result = generateSlug('Chapter 123')
      expect(result).toBe('chapter-123')
    })

    it('should handle mixed alphanumeric', () => {
      const result = generateSlug('Book 2: The Sequel')
      expect(result).toBe('book-2-the-sequel')
    })

    it('should handle Unicode/Chinese characters', () => {
      const result = generateSlug('你好世界')
      expect(result).toBe('')
    })

    it('should handle emojis', () => {
      const result = generateSlug('Hello 🌍 World')
      expect(result).toBe('hello-world')
    })

    it('should handle already-slugified strings', () => {
      const result = generateSlug('already-a-slug')
      expect(result).toBe('already-a-slug')
    })

    it('should handle empty string', () => {
      const result = generateSlug('')
      expect(result).toBe('')
    })

    it('should handle real novel titles', () => {
      const testCases = [
        { input: 'A Court of Thorns and Roses', expected: 'a-court-of-thorns-and-roses' },
        { input: "Harry Potter & the Sorcerer's Stone", expected: 'harry-potter-the-sorcerer-s-stone' },
        { input: 'The Lord of the Rings: The Fellowship', expected: 'the-lord-of-the-rings-the-fellowship' },
      ]

      testCases.forEach(({ input, expected }) => {
        expect(generateSlug(input)).toBe(expected)
      })
    })
  })

  describe('formatDate() - 日期格式化', () => {
    it('should format Date object', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date)

      // 结果应该类似 "January 15, 2024"
      expect(result).toMatch(/January \d+, 2024/)
    })

    it('should format ISO string', () => {
      const result = formatDate('2024-01-15T00:00:00.000Z')
      expect(result).toMatch(/January \d+, 2024/)
    })

    it('should handle different months', () => {
      const months = [
        { date: '2024-01-01', month: 'January' },
        { date: '2024-02-01', month: 'February' },
        { date: '2024-03-01', month: 'March' },
        { date: '2024-12-31', month: 'December' },
      ]

      months.forEach(({ date, month }) => {
        const result = formatDate(date)
        expect(result).toContain(month)
        expect(result).toContain('2024')
      })
    })

    it('should handle leap year', () => {
      const result = formatDate('2024-02-29')
      expect(result).toContain('February')
      expect(result).toContain('29')
    })

    it('should handle year boundaries', () => {
      const result1 = formatDate('2023-12-31')
      expect(result1).toContain('2023')

      const result2 = formatDate('2024-01-01')
      expect(result2).toContain('2024')
    })

    it('should format consistently', () => {
      const date = new Date('2024-06-15')
      const result1 = formatDate(date)
      const result2 = formatDate(date)

      expect(result1).toBe(result2)
    })
  })

  describe('truncate() - 文本截断', () => {
    it('should truncate text longer than limit', () => {
      const text = 'This is a very long text that needs to be truncated'
      const result = truncate(text, 20)

      expect(result).toBe('This is a very long ...')
      expect(result.length).toBe(23) // 20 + 3 dots
    })

    it('should not truncate text shorter than limit', () => {
      const text = 'Short text'
      const result = truncate(text, 20)

      expect(result).toBe('Short text')
      expect(result).not.toContain('...')
    })

    it('should not truncate text equal to limit', () => {
      const text = 'Exactly 20 chars text'
      const result = truncate(text, text.length)

      expect(result).toBe(text)
      expect(result).not.toContain('...')
    })

    it('should handle very short limits', () => {
      const text = 'Hello World'
      const result = truncate(text, 5)

      expect(result).toBe('Hello...')
    })

    it('should handle limit of 0', () => {
      const text = 'Hello World'
      const result = truncate(text, 0)

      expect(result).toBe('...')
    })

    it('should handle empty string', () => {
      const result = truncate('', 10)
      expect(result).toBe('')
    })

    it('should handle Unicode characters', () => {
      const text = '你好世界，这是一个测试'
      const result = truncate(text, 5)

      expect(result).toBe('你好世界，...')
    })

    it('should preserve word boundaries - not implemented', () => {
      // 注意: 当前实现不保留单词边界，这是预期行为
      const text = 'The quick brown fox jumps'
      const result = truncate(text, 10)

      expect(result).toBe('The quick ...')
    })

    it('should handle multiple spaces', () => {
      const text = 'Hello    World    Test'
      const result = truncate(text, 10)

      expect(result).toBe('Hello    W...')
    })

    it('should handle real-world blurbs', () => {
      const blurb = 'Discover millions of novels for free. Read fantasy, romance, sci-fi, and more. Join our community of readers and writers.'
      const result = truncate(blurb, 60)

      expect(result.length).toBe(63) // 60 + 3 dots
      expect(result).toBe('Discover millions of novels for free. Read fantasy, romance,...')
    })
  })

  describe('集成测试', () => {
    it('should work together for novel metadata', () => {
      const novel = {
        title: 'The Truth Switch!',
        blurb: 'This is a very long blurb that describes the novel in great detail and needs to be truncated for display purposes',
        publishedAt: new Date('2024-01-15'),
      }

      const slug = generateSlug(novel.title)
      const shortBlurb = truncate(novel.blurb, 50)
      const formattedDate = formatDate(novel.publishedAt)

      expect(slug).toBe('the-truth-switch')
      expect(shortBlurb).toContain('...')
      expect(formattedDate).toContain('January')
    })

    it('should work for dynamic class names', () => {
      const status = 'ongoing'
      const isPremium = true

      const classes = cn(
        'novel-card',
        `status-${status}`,
        isPremium && 'premium'
      )

      expect(classes).toBe('novel-card status-ongoing premium')
    })
  })
})
