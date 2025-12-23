/**
 * 数据库重试机制测试
 * 测试连接错误重试、指数退避、错误识别
 */

import { withRetry } from '@/lib/db-retry'

// Mock console methods
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation()
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

describe('db-retry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('withRetry() - 成功场景', () => {
    it('should return result on first attempt if successful', async () => {
      const operation = jest.fn().mockResolvedValue('success')

      const result = await withRetry(operation)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
      expect(mockConsoleWarn).not.toHaveBeenCalled()
    })

    it('should work with different return types', async () => {
      const operations = [
        jest.fn().mockResolvedValue(42),
        jest.fn().mockResolvedValue({ id: 1, name: 'test' }),
        jest.fn().mockResolvedValue([1, 2, 3]),
        jest.fn().mockResolvedValue(true),
      ]

      const results = await Promise.all(
        operations.map(op => withRetry(op))
      )

      expect(results).toEqual([
        42,
        { id: 1, name: 'test' },
        [1, 2, 3],
        true,
      ])
    })

    it('should handle async operations', async () => {
      const operation = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'delayed-result'
      })

      const result = await withRetry(operation)

      expect(result).toBe('delayed-result')
    })
  })

  describe('withRetry() - 连接错误重试', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    it('should retry on Prisma P1001 error (can\'t reach database)', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce({ code: 'P1001', message: "Can't reach database server" })
        .mockResolvedValueOnce('success')

      const promise = withRetry(operation, { maxRetries: 2 })

      // 快进初始延迟
      await jest.advanceTimersByTimeAsync(1000)

      const result = await promise

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1)
    })

    it('should retry on Prisma P1002 error (connection timed out)', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce({ code: 'P1002', message: 'Connection timed out' })
        .mockResolvedValueOnce('success')

      const promise = withRetry(operation, { maxRetries: 2 })
      await jest.advanceTimersByTimeAsync(1000)

      const result = await promise
      expect(result).toBe('success')
    })

    it('should retry on Prisma P1008 error (operations timed out)', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce({ code: 'P1008', message: 'Operations timed out' })
        .mockResolvedValueOnce('success')

      const promise = withRetry(operation, { maxRetries: 2 })
      await jest.advanceTimersByTimeAsync(1000)

      const result = await promise
      expect(result).toBe('success')
    })

    it('should retry on message-based connection errors', async () => {
      const errorMessages = [
        "Can't reach database",
        'Connection refused',
        'Connection timeout',
      ]

      for (const message of errorMessages) {
        jest.clearAllMocks()

        const operation = jest.fn()
          .mockRejectedValueOnce(new Error(message))
          .mockResolvedValueOnce('success')

        const promise = withRetry(operation, { maxRetries: 2 })
        await jest.advanceTimersByTimeAsync(1000)

        const result = await promise
        expect(result).toBe('success')
      }
    })
  })

  describe('withRetry() - 指数退避', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    it('should use exponential backoff delays', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce({ code: 'P1001', message: 'Error 1' })
        .mockRejectedValueOnce({ code: 'P1001', message: 'Error 2' })
        .mockRejectedValueOnce({ code: 'P1001', message: 'Error 3' })
        .mockResolvedValueOnce('success')

      const promise = withRetry(operation, {
        maxRetries: 4,
        initialDelay: 1000,
        maxDelay: 10000,
      })

      // 第1次失败 → 等待 1000ms
      await jest.advanceTimersByTimeAsync(1000)

      // 第2次失败 → 等待 2000ms (1000 * 2)
      await jest.advanceTimersByTimeAsync(2000)

      // 第3次失败 → 等待 4000ms (2000 * 2)
      await jest.advanceTimersByTimeAsync(4000)

      const result = await promise

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(4)
    })

    it('should cap delay at maxDelay', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce({ code: 'P1001', message: 'Error 1' })
        .mockRejectedValueOnce({ code: 'P1001', message: 'Error 2' })
        .mockRejectedValueOnce({ code: 'P1001', message: 'Error 3' })
        .mockResolvedValueOnce('success')

      const promise = withRetry(operation, {
        maxRetries: 4,
        initialDelay: 5000,
        maxDelay: 6000, // 延迟上限
      })

      // 第1次失败 → 等待 5000ms
      await jest.advanceTimersByTimeAsync(5000)

      // 第2次失败 → 等待 6000ms (capped, not 10000ms)
      await jest.advanceTimersByTimeAsync(6000)

      // 第3次失败 → 等待 6000ms (capped, not 20000ms)
      await jest.advanceTimersByTimeAsync(6000)

      const result = await promise
      expect(result).toBe('success')
    })

    it('should use custom initial delay', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce({ code: 'P1001', message: 'Error' })
        .mockResolvedValueOnce('success')

      const promise = withRetry(operation, {
        maxRetries: 2,
        initialDelay: 500,
      })

      // 应该等待 500ms
      await jest.advanceTimersByTimeAsync(500)

      const result = await promise
      expect(result).toBe('success')
    })
  })

  describe('withRetry() - 错误识别', () => {
    it('should NOT retry on non-connection errors', async () => {
      const operation = jest.fn()
        .mockRejectedValue(new Error('Validation error'))

      await expect(withRetry(operation, { maxRetries: 3 }))
        .rejects.toThrow('Validation error')

      expect(operation).toHaveBeenCalledTimes(1)
      expect(mockConsoleWarn).not.toHaveBeenCalled()
      expect(mockConsoleError).toHaveBeenCalledTimes(1)
    })

    it('should NOT retry on Prisma unique constraint error', async () => {
      const operation = jest.fn()
        .mockRejectedValue({ code: 'P2002', message: 'Unique constraint failed' })

      await expect(withRetry(operation, { maxRetries: 3 }))
        .rejects.toMatchObject({ code: 'P2002' })

      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should NOT retry on Prisma not found error', async () => {
      const operation = jest.fn()
        .mockRejectedValue({ code: 'P2025', message: 'Record not found' })

      await expect(withRetry(operation, { maxRetries: 3 }))
        .rejects.toMatchObject({ code: 'P2025' })

      expect(operation).toHaveBeenCalledTimes(1)
    })
  })

  describe('withRetry() - 最大重试次数', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    it('should respect maxRetries limit', async () => {
      const operation = jest.fn()
        .mockRejectedValue({ code: 'P1001', message: 'Connection error' })

      const promise = withRetry(operation, { maxRetries: 3 }).catch(err => err)

      // Advance timers incrementally to trigger retries
      // Attempt 1 → wait 1000ms
      await jest.advanceTimersByTimeAsync(1000)
      // Attempt 2 → wait 2000ms
      await jest.advanceTimersByTimeAsync(2000)
      // Attempt 3 → throws

      // Await the error result
      const error = await promise

      expect(error).toMatchObject({ code: 'P1001' })
      expect(operation).toHaveBeenCalledTimes(3)
      expect(mockConsoleWarn).toHaveBeenCalledTimes(2) // 前2次警告
      expect(mockConsoleError).toHaveBeenCalledTimes(1) // 最后1次错误
    })

    it('should throw after exhausting all retries', async () => {
      const operation = jest.fn()
        .mockRejectedValue({ code: 'P1001', message: 'Persistent error' })

      const promise = withRetry(operation, { maxRetries: 1 })

      // Await rejection (no retry needed for maxRetries=1)
      await expect(promise).rejects.toMatchObject({
        code: 'P1001',
        message: 'Persistent error',
      })

      expect(operation).toHaveBeenCalledTimes(1)
      expect(mockConsoleError).toHaveBeenCalled()
    })

    it('should use default maxRetries of 1', async () => {
      const operation = jest.fn()
        .mockRejectedValue({ code: 'P1001', message: 'Error' })

      await expect(withRetry(operation)).rejects.toMatchObject({ code: 'P1001' })

      expect(operation).toHaveBeenCalledTimes(1)
    })
  })

  describe('withRetry() - 日志记录', () => {
    it('should log operation name in warnings', async () => {
      jest.useFakeTimers()

      const operation = jest.fn()
        .mockRejectedValueOnce({ code: 'P1001', message: 'Connection error' })
        .mockResolvedValueOnce('success')

      const promise = withRetry(operation, {
        maxRetries: 2,
        operationName: 'Fetch novels',
      })

      await jest.advanceTimersByTimeAsync(1000)
      await promise

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Fetch novels')
      )
    })

    it('should log operation name in errors', async () => {
      const operation = jest.fn()
        .mockRejectedValue({ code: 'P1001', message: 'Error' })

      await expect(
        withRetry(operation, {
          maxRetries: 1,
          operationName: 'Create user',
        })
      ).rejects.toMatchObject({ code: 'P1001' })

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Create user'),
        expect.any(String)
      )
    })

    it('should use default operation name', async () => {
      const operation = jest.fn()
        .mockRejectedValue({ code: 'P1001', message: 'Error' })

      await expect(withRetry(operation, { maxRetries: 1 })).rejects.toMatchObject({ code: 'P1001' })

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Database operation'),
        expect.any(String)
      )
    })
  })

  describe('withRetry() - 边界条件', () => {
    it('should handle maxRetries = 0 by throwing', async () => {
      const operation = jest.fn().mockResolvedValue('success')

      // maxRetries = 0 means no attempts, should fail
      await expect(withRetry(operation, { maxRetries: 0 })).rejects.toThrow('Operation failed')

      expect(operation).toHaveBeenCalledTimes(0)
    })

    it('should handle extremely large maxRetries', async () => {
      const operation = jest.fn().mockResolvedValue('success')

      const result = await withRetry(operation, { maxRetries: 1000000 })

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should handle zero initial delay', async () => {
      jest.useFakeTimers()

      const operation = jest.fn()
        .mockRejectedValueOnce({ code: 'P1001', message: 'Error' })
        .mockResolvedValueOnce('success')

      const promise = withRetry(operation, {
        maxRetries: 2,
        initialDelay: 0,
      })

      await jest.advanceTimersByTimeAsync(0)

      const result = await promise
      expect(result).toBe('success')
    })

    it('should handle errors without message', async () => {
      const operation = jest.fn()
        .mockRejectedValue({ code: 'P1001' })

      await expect(withRetry(operation, { maxRetries: 1 })).rejects.toMatchObject({
        code: 'P1001',
      })

      expect(mockConsoleError).toHaveBeenCalled()
    })
  })

  describe('withRetry() - 真实场景模拟', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    it('should simulate intermittent connection issues', async () => {
      let callCount = 0
      const operation = jest.fn(async () => {
        callCount++
        // 模拟前2次连接超时，第3次成功
        if (callCount < 3) {
          throw { code: 'P1002', message: 'Connection timed out' }
        }
        return { id: 1, title: 'Novel' }
      })

      const promise = withRetry(operation, { maxRetries: 3 })

      await jest.advanceTimersByTimeAsync(1000) // 第1次重试
      await jest.advanceTimersByTimeAsync(2000) // 第2次重试

      const result = await promise

      expect(result).toEqual({ id: 1, title: 'Novel' })
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should handle database serverless cold start', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce({ code: 'P1017', message: 'Server has closed the connection' })
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])

      const promise = withRetry(operation, {
        maxRetries: 2,
        operationName: 'List novels',
      })

      await jest.advanceTimersByTimeAsync(1000)

      const result = await promise

      expect(result).toHaveLength(2)
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('List novels')
      )
    })
  })
})
