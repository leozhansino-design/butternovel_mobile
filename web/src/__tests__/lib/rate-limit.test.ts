/**
 * 速率限制器测试
 * 测试滑动窗口算法、并发安全性、清理机制
 */

import { rateLimit, getIdentifier, rateLimitConfigs, limiter } from '@/lib/rate-limit'

describe('rate-limit', () => {
  // 测试前清理
  beforeEach(() => {
    // 清空限流器存储
    limiter['store'].clear()
  })

  describe('MemoryRateLimiter', () => {
    describe('check() - 基本功能', () => {
      it('should allow requests within limit', () => {
        const config = { interval: 1000, limit: 3 }
        const key = 'test-key'

        const result1 = limiter.check(key, config)
        expect(result1.success).toBe(true)
        expect(result1.limit).toBe(3)
        expect(result1.remaining).toBe(2)

        const result2 = limiter.check(key, config)
        expect(result2.success).toBe(true)
        expect(result2.remaining).toBe(1)

        const result3 = limiter.check(key, config)
        expect(result3.success).toBe(true)
        expect(result3.remaining).toBe(0)
      })

      it('should block requests exceeding limit', () => {
        const config = { interval: 1000, limit: 2 }
        const key = 'test-key'

        limiter.check(key, config) // 1st
        limiter.check(key, config) // 2nd

        const result = limiter.check(key, config) // 3rd - should fail
        expect(result.success).toBe(false)
        expect(result.remaining).toBe(0)
      })

      it('should calculate correct reset time', () => {
        const config = { interval: 5000, limit: 1 }
        const key = 'test-key'

        const before = Date.now()
        const result = limiter.check(key, config)
        const after = Date.now()

        expect(result.reset).toBeGreaterThanOrEqual(before + config.interval)
        expect(result.reset).toBeLessThanOrEqual(after + config.interval + 10) // 10ms tolerance
      })
    })

    describe('check() - 滑动窗口', () => {
      it('should reset after time window expires', async () => {
        const config = { interval: 100, limit: 2 } // 100ms window
        const key = 'test-key'

        // 使用完限额
        limiter.check(key, config)
        limiter.check(key, config)

        // 第三次应该失败
        const blocked = limiter.check(key, config)
        expect(blocked.success).toBe(false)

        // 等待窗口过期
        await new Promise(resolve => setTimeout(resolve, 150))

        // 现在应该允许
        const allowed = limiter.check(key, config)
        expect(allowed.success).toBe(true)
        expect(allowed.remaining).toBe(1)
      })

      it('should only remove expired timestamps', async () => {
        const config = { interval: 100, limit: 3 }
        const key = 'test-key'

        // T=0: 第一个请求
        limiter.check(key, config)

        // T=60: 第二个请求（还在窗口内）
        await new Promise(resolve => setTimeout(resolve, 60))
        limiter.check(key, config)

        // T=120: 第三个请求（第一个已过期）
        await new Promise(resolve => setTimeout(resolve, 60))
        const result = limiter.check(key, config)

        // 应该只有2个有效时间戳（第2、3次请求）
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(1) // 3 - 2 = 1
      })
    })

    describe('check() - 隔离性', () => {
      it('should track different keys independently', () => {
        const config = { interval: 1000, limit: 1 }

        const result1 = limiter.check('user1', config)
        const result2 = limiter.check('user2', config)

        expect(result1.success).toBe(true)
        expect(result2.success).toBe(true)
        expect(result1.remaining).toBe(0)
        expect(result2.remaining).toBe(0)
      })

      it('should not affect other keys when one is blocked', () => {
        const config = { interval: 1000, limit: 1 }

        // user1 使用完限额
        limiter.check('user1', config)
        const blocked = limiter.check('user1', config)
        expect(blocked.success).toBe(false)

        // user2 应该仍然可以
        const allowed = limiter.check('user2', config)
        expect(allowed.success).toBe(true)
      })
    })

    describe('check() - 边界条件', () => {
      it('should handle limit of 0', () => {
        const config = { interval: 1000, limit: 0 }
        const result = limiter.check('test', config)

        expect(result.success).toBe(false)
        expect(result.limit).toBe(0)
        expect(result.remaining).toBe(0)
      })

      it('should handle very large limits', () => {
        const config = { interval: 1000, limit: 1000000 }
        const result = limiter.check('test', config)

        expect(result.success).toBe(true)
        expect(result.remaining).toBeGreaterThan(999990) // 允许一些误差
      })

      it('should handle very short intervals', async () => {
        const config = { interval: 10, limit: 1 } // 10ms window

        limiter.check('test', config)
        await new Promise(resolve => setTimeout(resolve, 15))

        const result = limiter.check('test', config)
        expect(result.success).toBe(true)
      })
    })

    describe('cleanup()', () => {
      it('should remove entries with no activity for 15+ minutes', async () => {
        const config = { interval: 1000, limit: 1 }
        limiter.check('test', config)

        // 手动设置为15分钟前的时间戳
        const entry = limiter['store'].get('test')!
        entry.timestamps[0] = Date.now() - (16 * 60 * 1000)

        // 触发清理
        limiter['cleanup']()

        // 应该被删除
        expect(limiter['store'].has('test')).toBe(false)
      })

      it('should keep entries with recent activity', () => {
        const config = { interval: 1000, limit: 1 }
        limiter.check('test', config)

        // 触发清理
        limiter['cleanup']()

        // 应该仍然存在
        expect(limiter['store'].has('test')).toBe(true)
      })

      it('should not affect other entries', () => {
        const config = { interval: 1000, limit: 1 }

        limiter.check('old', config)
        limiter.check('new', config)

        // 将 'old' 设置为过期
        const oldEntry = limiter['store'].get('old')!
        oldEntry.timestamps[0] = Date.now() - (16 * 60 * 1000)

        limiter['cleanup']()

        expect(limiter['store'].has('old')).toBe(false)
        expect(limiter['store'].has('new')).toBe(true)
      })
    })

    describe('destroy()', () => {
      it('should clear cleanup interval', () => {
        const testLimiter = new (limiter.constructor as any)()
        expect(testLimiter['cleanupInterval']).not.toBeNull()

        testLimiter.destroy()
        expect(testLimiter['cleanupInterval']).toBeNull()
      })
    })
  })

  describe('rateLimit()', () => {
    it('should use correct config for different types', () => {
      const result1 = rateLimit('user1', 'search')
      expect(result1.limit).toBe(rateLimitConfigs.search.limit)

      limiter['store'].clear()

      const result2 = rateLimit('user2', 'rating')
      expect(result2.limit).toBe(rateLimitConfigs.rating.limit)
    })

    it('should prefix key with type', () => {
      rateLimit('user1', 'search')
      rateLimit('user1', 'rating')

      // 不同类型应该独立计数
      expect(limiter['store'].has('search:user1')).toBe(true)
      expect(limiter['store'].has('rating:user1')).toBe(true)
    })

    it('should use default "api" type when not specified', () => {
      const result = rateLimit('user1')
      expect(result.limit).toBe(rateLimitConfigs.api.limit)
    })

    it('should enforce search limit (10 req / 10s)', () => {
      const identifier = 'test-user'

      // 允许 10 次
      for (let i = 0; i < 10; i++) {
        const result = rateLimit(identifier, 'search')
        expect(result.success).toBe(true)
      }

      // 第 11 次应该失败
      const blocked = rateLimit(identifier, 'search')
      expect(blocked.success).toBe(false)
    })

    it('should enforce rating limit (5 req / 60s)', () => {
      const identifier = 'test-user'

      // 允许 5 次
      for (let i = 0; i < 5; i++) {
        const result = rateLimit(identifier, 'rating')
        expect(result.success).toBe(true)
      }

      // 第 6 次应该失败
      const blocked = rateLimit(identifier, 'rating')
      expect(blocked.success).toBe(false)
    })
  })

  describe('getIdentifier()', () => {
    it('should prioritize userId when provided', () => {
      const mockRequest = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '1.2.3.4',
          'x-real-ip': '5.6.7.8',
        },
      })

      const result = getIdentifier(mockRequest, 'user123')
      expect(result).toBe('user:user123')
    })

    it('should use x-forwarded-for when available', () => {
      const mockRequest = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '1.2.3.4, 5.6.7.8',
        },
      })

      const result = getIdentifier(mockRequest)
      expect(result).toBe('ip:1.2.3.4')
    })

    it('should handle multiple IPs in x-forwarded-for', () => {
      const mockRequest = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '  1.2.3.4  ,  5.6.7.8  ',
        },
      })

      const result = getIdentifier(mockRequest)
      expect(result).toBe('ip:1.2.3.4')
    })

    it('should fallback to x-real-ip', () => {
      const mockRequest = new Request('http://localhost', {
        headers: {
          'x-real-ip': '5.6.7.8',
        },
      })

      const result = getIdentifier(mockRequest)
      expect(result).toBe('ip:5.6.7.8')
    })

    it('should fallback to anonymous when no headers', () => {
      const mockRequest = new Request('http://localhost')

      const result = getIdentifier(mockRequest)
      expect(result).toBe('anonymous')
    })

    it('should handle empty x-forwarded-for', () => {
      const mockRequest = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '',
        },
      })

      const result = getIdentifier(mockRequest)
      expect(result).toBe('anonymous')
    })
  })

  describe('并发安全性', () => {
    it('should handle concurrent requests correctly', () => {
      const config = { interval: 1000, limit: 10 }
      const key = 'test-key'

      // 模拟 20 个并发请求
      const results = Array.from({ length: 20 }, () =>
        limiter.check(key, config)
      )

      // 前 10 个应该成功
      const successful = results.filter(r => r.success).length
      expect(successful).toBe(10)

      // 后 10 个应该失败
      const failed = results.filter(r => !r.success).length
      expect(failed).toBe(10)
    })

    it('should maintain count accuracy under load', () => {
      const config = { interval: 1000, limit: 100 }

      // 从3个不同key同时发送请求
      const keys = ['user1', 'user2', 'user3']
      const allResults = keys.flatMap(key =>
        Array.from({ length: 50 }, () => limiter.check(key, config))
      )

      // 每个key应该有50个成功
      keys.forEach(key => {
        const entry = limiter['store'].get(key)
        expect(entry?.timestamps.length).toBe(50)
      })
    })
  })

  describe('配置验证', () => {
    it('should have correct search config', () => {
      expect(rateLimitConfigs.search).toEqual({
        interval: 10 * 1000,
        limit: 10,
      })
    })

    it('should have correct rating config', () => {
      expect(rateLimitConfigs.rating).toEqual({
        interval: 60 * 1000,
        limit: 5,
      })
    })

    it('should have correct comment config', () => {
      expect(rateLimitConfigs.comment).toEqual({
        interval: 60 * 1000,
        limit: 10,
      })
    })

    it('should have correct auth config', () => {
      expect(rateLimitConfigs.auth).toEqual({
        interval: 60 * 60 * 1000,
        limit: 5,
      })
    })

    it('should have correct upload config', () => {
      expect(rateLimitConfigs.upload).toEqual({
        interval: 60 * 1000,
        limit: 3,
      })
    })

    it('should have correct api config', () => {
      expect(rateLimitConfigs.api).toEqual({
        interval: 60 * 1000,
        limit: 30,
      })
    })
  })
})
