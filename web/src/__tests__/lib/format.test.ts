/**
 * 格式化函数测试
 * 测试数字格式化（K, M 单位）
 */

import { formatNumber } from '@/lib/format'

describe('format', () => {
  describe('formatNumber() - 数字简洁显示', () => {
    describe('小于 1000 - 直接显示', () => {
      it('should display small numbers as-is', () => {
        expect(formatNumber(0)).toBe('0')
        expect(formatNumber(1)).toBe('1')
        expect(formatNumber(10)).toBe('10')
        expect(formatNumber(99)).toBe('99')
        expect(formatNumber(100)).toBe('100')
        expect(formatNumber(999)).toBe('999')
      })

      it('should handle negative numbers', () => {
        expect(formatNumber(-1)).toBe('-1')
        expect(formatNumber(-999)).toBe('-999')
      })

      it('should handle zero', () => {
        expect(formatNumber(0)).toBe('0')
      })
    })

    describe('1000 - 999999 - 使用 K', () => {
      it('should format exact thousands', () => {
        expect(formatNumber(1000)).toBe('1k')
        expect(formatNumber(2000)).toBe('2k')
        expect(formatNumber(10000)).toBe('10k')
        expect(formatNumber(100000)).toBe('100k')
      })

      it('should format with one decimal for non-exact thousands', () => {
        expect(formatNumber(1500)).toBe('1.5k')
        expect(formatNumber(1234)).toBe('1.2k')
        expect(formatNumber(15678)).toBe('15.7k')
        expect(formatNumber(999999)).toBe('1000.0k')
      })

      it('should round to one decimal place', () => {
        expect(formatNumber(1234)).toBe('1.2k') // 1.234k → 1.2k
        expect(formatNumber(1256)).toBe('1.3k') // 1.256k → 1.3k
        expect(formatNumber(1999)).toBe('2.0k') // 1.999k → 2.0k
      })

      it('should handle common view counts', () => {
        expect(formatNumber(1500)).toBe('1.5k')   // 1.5千
        expect(formatNumber(10000)).toBe('10k')   // 1万
        expect(formatNumber(50000)).toBe('50k')   // 5万
        expect(formatNumber(100000)).toBe('100k') // 10万
      })
    })

    describe('1000000+ - 使用 M', () => {
      it('should format exact millions', () => {
        expect(formatNumber(1000000)).toBe('1m')
        expect(formatNumber(2000000)).toBe('2m')
        expect(formatNumber(10000000)).toBe('10m')
      })

      it('should format with one decimal for non-exact millions', () => {
        expect(formatNumber(1500000)).toBe('1.5m')
        expect(formatNumber(1234567)).toBe('1.2m')
        expect(formatNumber(15678900)).toBe('15.7m')
      })

      it('should round to one decimal place', () => {
        expect(formatNumber(1234567)).toBe('1.2m') // 1.234567m → 1.2m
        expect(formatNumber(1256789)).toBe('1.3m') // 1.256789m → 1.3m
        expect(formatNumber(1999999)).toBe('2.0m') // 1.999999m → 2.0m
      })

      it('should handle large numbers', () => {
        expect(formatNumber(100000000)).toBe('100m')
        expect(formatNumber(999999999)).toBe('1000.0m')
        expect(formatNumber(1000000000)).toBe('1000m')
      })
    })

    describe('边界条件', () => {
      it('should handle boundary at 1000', () => {
        expect(formatNumber(999)).toBe('999')
        expect(formatNumber(1000)).toBe('1k')
        expect(formatNumber(1001)).toBe('1.0k')
      })

      it('should handle boundary at 1000000', () => {
        expect(formatNumber(999999)).toBe('1000.0k')
        expect(formatNumber(1000000)).toBe('1m')
        expect(formatNumber(1000001)).toBe('1.0m')
      })

      it('should handle very large numbers', () => {
        expect(formatNumber(999999999)).toBe('1000.0m')
        expect(formatNumber(1000000000)).toBe('1000m')
        expect(formatNumber(9999999999)).toBe('10000.0m')
      })
    })

    describe('实际使用场景', () => {
      it('should format view counts', () => {
        const testCases = [
          { input: 42, expected: '42' },
          { input: 156, expected: '156' },
          { input: 1234, expected: '1.2k' },
          { input: 15678, expected: '15.7k' },
          { input: 123456, expected: '123.5k' },
          { input: 1234567, expected: '1.2m' },
        ]

        testCases.forEach(({ input, expected }) => {
          expect(formatNumber(input)).toBe(expected)
        })
      })

      it('should format like counts', () => {
        expect(formatNumber(5)).toBe('5')
        expect(formatNumber(250)).toBe('250')
        expect(formatNumber(2500)).toBe('2.5k')
        expect(formatNumber(25000)).toBe('25k')
      })

      it('should format bookmark counts', () => {
        expect(formatNumber(100)).toBe('100')
        expect(formatNumber(1000)).toBe('1k')
        expect(formatNumber(10000)).toBe('10k')
        expect(formatNumber(100000)).toBe('100k')
      })

      it('should format chapter counts', () => {
        expect(formatNumber(50)).toBe('50')
        expect(formatNumber(500)).toBe('500')
        expect(formatNumber(5000)).toBe('5k')
      })
    })

    describe('精度和舍入', () => {
      it('should maintain precision for small decimals', () => {
        expect(formatNumber(1100)).toBe('1.1k')
        expect(formatNumber(1200)).toBe('1.2k')
        expect(formatNumber(1900)).toBe('1.9k')
      })

      it('should round correctly', () => {
        expect(formatNumber(1950)).toBe('1.9k') // 1950 / 1000 = 1.95 → 1.9k
        expect(formatNumber(1960)).toBe('2.0k') // 1960 / 1000 = 1.96 → 2.0k
        expect(formatNumber(1990)).toBe('2.0k') // 1990 / 1000 = 1.99 → 2.0k
      })

      it('should round down correctly', () => {
        expect(formatNumber(1140)).toBe('1.1k') // 1.14k rounds to 1.1k
        expect(formatNumber(1240)).toBe('1.2k') // 1.24k rounds to 1.2k
      })

      it('should handle .0 decimals', () => {
        expect(formatNumber(2000)).toBe('2k') // 整数不显示.0
        expect(formatNumber(2001)).toBe('2.0k') // 非整数显示.0
        expect(formatNumber(2050)).toBe('2.0k') // 2050 → 2.0k (floor)
      })
    })

    describe('负数处理', () => {
      it('should handle negative thousands', () => {
        expect(formatNumber(-1000)).toBe('-1k')
        expect(formatNumber(-1500)).toBe('-1.5k')
        expect(formatNumber(-10000)).toBe('-10k')
      })

      it('should handle negative millions', () => {
        expect(formatNumber(-1000000)).toBe('-1m')
        expect(formatNumber(-1500000)).toBe('-1.5m')
      })

      it('should handle negative small numbers', () => {
        expect(formatNumber(-10)).toBe('-10')
        expect(formatNumber(-999)).toBe('-999')
      })
    })

    describe('特殊值', () => {
      it('should handle decimal inputs (rounded)', () => {
        expect(formatNumber(1234.56)).toBe('1.2k')
        expect(formatNumber(999.9)).toBe('999') // floor(999.9) = 999
      })

      it('should handle very small decimals', () => {
        expect(formatNumber(0.5)).toBe('0') // floor(0.5) = 0
        expect(formatNumber(0.9)).toBe('0') // floor(0.9) = 0
      })
    })

    describe('一致性检查', () => {
      it('should be consistent for same input', () => {
        const num = 12345
        const result1 = formatNumber(num)
        const result2 = formatNumber(num)
        expect(result1).toBe(result2)
      })

      it('should maintain order', () => {
        const numbers = [999, 1000, 1001, 1500, 2000]
        const formatted = numbers.map(formatNumber)

        // 确保格式化后仍然是递增的（语义上）
        expect(formatted).toEqual(['999', '1k', '1.0k', '1.5k', '2k'])
      })
    })

    describe('真实数据测试', () => {
      it('should format real view count progression', () => {
        const viewCounts = [0, 10, 100, 1000, 10000, 100000, 1000000]
        const expected = ['0', '10', '100', '1k', '10k', '100k', '1m']

        viewCounts.forEach((count, i) => {
          expect(formatNumber(count)).toBe(expected[i])
        })
      })

      it('should format typical novel statistics', () => {
        const novel = {
          viewCount: 156789,
          likeCount: 2345,
          bookmarkCount: 890,
          commentCount: 156,
        }

        expect(formatNumber(novel.viewCount)).toBe('156.8k')
        expect(formatNumber(novel.likeCount)).toBe('2.3k')
        expect(formatNumber(novel.bookmarkCount)).toBe('890')
        expect(formatNumber(novel.commentCount)).toBe('156')
      })

      it('should format viral novel statistics', () => {
        const viralNovel = {
          viewCount: 5000000,
          likeCount: 250000,
          bookmarkCount: 150000,
        }

        expect(formatNumber(viralNovel.viewCount)).toBe('5m')
        expect(formatNumber(viralNovel.likeCount)).toBe('250k')
        expect(formatNumber(viralNovel.bookmarkCount)).toBe('150k')
      })
    })
  })
})
