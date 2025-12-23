/**
 * 分页工具测试
 * 测试分页参数解析、验证、响应生成
 */

import {
  parsePaginationParams,
  createPaginationResponse,
  validatePaginationParams,
  type PaginationParams,
} from '@/lib/pagination'

describe('pagination', () => {
  describe('parsePaginationParams() - 解析分页参数', () => {
    describe('从 URL 字符串解析', () => {
      it('should parse pagination from URL string', () => {
        const url = 'http://localhost:3000/api/novels?page=2&limit=20'
        const result = parsePaginationParams(url)

        expect(result).toEqual({
          page: 2,
          limit: 20,
          offset: 20, // (2-1) * 20
        })
      })

      it('should use defaults when params missing', () => {
        const url = 'http://localhost:3000/api/novels'
        const result = parsePaginationParams(url)

        expect(result).toEqual({
          page: 1,
          limit: 10,
          offset: 0,
        })
      })

      it('should handle custom defaults', () => {
        const url = 'http://localhost:3000/api/novels'
        const result = parsePaginationParams(url, {
          defaultLimit: 25,
        })

        expect(result).toEqual({
          page: 1,
          limit: 25,
          offset: 0,
        })
      })
    })

    describe('从 URLSearchParams 解析', () => {
      it('should parse pagination from URLSearchParams', () => {
        const params = new URLSearchParams('page=3&limit=15')
        const result = parsePaginationParams(params)

        expect(result).toEqual({
          page: 3,
          limit: 15,
          offset: 30, // (3-1) * 15
        })
      })

      it('should handle empty URLSearchParams', () => {
        const params = new URLSearchParams()
        const result = parsePaginationParams(params)

        expect(result).toEqual({
          page: 1,
          limit: 10,
          offset: 0,
        })
      })
    })

    describe('验证和规范化', () => {
      it('should enforce page >= 1', () => {
        const testCases = ['page=0', 'page=-1', 'page=-999']

        testCases.forEach(query => {
          const params = new URLSearchParams(query)
          const result = parsePaginationParams(params)
          expect(result.page).toBe(1)
        })
      })

      it('should enforce limit >= 1', () => {
        const testCases = ['limit=0', 'limit=-1', 'limit=-999']

        testCases.forEach(query => {
          const params = new URLSearchParams(query)
          const result = parsePaginationParams(params)
          expect(result.limit).toBe(10) // 使用默认值
        })
      })

      it('should enforce maxLimit', () => {
        const params = new URLSearchParams('limit=1000')
        const result = parsePaginationParams(params, {
          maxLimit: 50,
        })

        expect(result.limit).toBe(50)
      })

      it('should use custom maxLimit', () => {
        const params = new URLSearchParams('limit=200')
        const result = parsePaginationParams(params, {
          maxLimit: 100,
        })

        expect(result.limit).toBe(100)
      })

      it('should handle invalid page format', () => {
        const testCases = ['page=abc', 'page=1.5', 'page=NaN', 'page=Infinity']

        testCases.forEach(query => {
          const params = new URLSearchParams(query)
          const result = parsePaginationParams(params)
          expect(result.page).toBe(1)
        })
      })

      it('should handle invalid limit format', () => {
        const testCases = [
          { query: 'limit=abc', expected: 10 },
          { query: 'limit=1.5', expected: 1 }, // parseInt('1.5') = 1
          { query: 'limit=NaN', expected: 10 },
        ]

        testCases.forEach(({ query, expected }) => {
          const params = new URLSearchParams(query)
          const result = parsePaginationParams(params)
          expect(result.limit).toBe(expected)
        })
      })
    })

    describe('offset 计算', () => {
      it('should calculate correct offset', () => {
        const testCases = [
          { page: 1, limit: 10, expectedOffset: 0 },
          { page: 2, limit: 10, expectedOffset: 10 },
          { page: 3, limit: 10, expectedOffset: 20 },
          { page: 1, limit: 20, expectedOffset: 0 },
          { page: 5, limit: 25, expectedOffset: 100 },
          { page: 10, limit: 50, expectedOffset: 450 },
        ]

        testCases.forEach(({ page, limit, expectedOffset }) => {
          const params = new URLSearchParams(`page=${page}&limit=${limit}`)
          const result = parsePaginationParams(params)
          expect(result.offset).toBe(expectedOffset)
        })
      })

      it('should handle first page offset', () => {
        const params = new URLSearchParams('page=1&limit=10')
        const result = parsePaginationParams(params)
        expect(result.offset).toBe(0)
      })

      it('should handle large page numbers', () => {
        const params = new URLSearchParams('page=1000&limit=50')
        const result = parsePaginationParams(params)
        expect(result.offset).toBe(49950) // (1000-1) * 50
      })
    })

    describe('真实场景', () => {
      it('should handle typical API request', () => {
        const url = 'http://localhost/api/novels?category=fantasy&page=3&limit=20'
        const result = parsePaginationParams(url)

        expect(result).toEqual({
          page: 3,
          limit: 20,
          offset: 40,
        })
      })

      it('should handle Prisma-style pagination', () => {
        const url = 'http://localhost/api/novels?page=2&limit=15'
        const { limit, offset } = parsePaginationParams(url)

        // 可以直接用于 Prisma
        expect({ take: limit, skip: offset }).toEqual({
          take: 15,
          skip: 15,
        })
      })
    })
  })

  describe('createPaginationResponse() - 创建分页响应', () => {
    describe('基本功能', () => {
      it('should create pagination response', () => {
        const params: PaginationParams = {
          page: 1,
          limit: 10,
          offset: 0,
        }

        const response = createPaginationResponse(params, 45)

        expect(response).toEqual({
          page: 1,
          limit: 10,
          total: 45,
          totalPages: 5,
          hasNextPage: true,
          hasPreviousPage: false,
        })
      })

      it('should calculate total pages correctly', () => {
        const testCases = [
          { total: 100, limit: 10, expectedPages: 10 },
          { total: 99, limit: 10, expectedPages: 10 },
          { total: 101, limit: 10, expectedPages: 11 },
          { total: 50, limit: 20, expectedPages: 3 },
          { total: 7, limit: 10, expectedPages: 1 },
        ]

        testCases.forEach(({ total, limit, expectedPages }) => {
          const params: PaginationParams = { page: 1, limit, offset: 0 }
          const response = createPaginationResponse(params, total)
          expect(response.totalPages).toBe(expectedPages)
        })
      })
    })

    describe('hasNextPage 标志', () => {
      it('should set hasNextPage = true when more pages available', () => {
        const params: PaginationParams = { page: 1, limit: 10, offset: 0 }
        const response = createPaginationResponse(params, 50)

        expect(response.hasNextPage).toBe(true)
      })

      it('should set hasNextPage = false on last page', () => {
        const params: PaginationParams = { page: 5, limit: 10, offset: 40 }
        const response = createPaginationResponse(params, 50)

        expect(response.hasNextPage).toBe(false)
      })

      it('should set hasNextPage = false on single page', () => {
        const params: PaginationParams = { page: 1, limit: 10, offset: 0 }
        const response = createPaginationResponse(params, 5)

        expect(response.hasNextPage).toBe(false)
      })
    })

    describe('hasPreviousPage 标志', () => {
      it('should set hasPreviousPage = false on first page', () => {
        const params: PaginationParams = { page: 1, limit: 10, offset: 0 }
        const response = createPaginationResponse(params, 50)

        expect(response.hasPreviousPage).toBe(false)
      })

      it('should set hasPreviousPage = true on subsequent pages', () => {
        const testCases = [2, 3, 10, 100]

        testCases.forEach(page => {
          const params: PaginationParams = { page, limit: 10, offset: (page - 1) * 10 }
          const response = createPaginationResponse(params, 1000)
          expect(response.hasPreviousPage).toBe(true)
        })
      })
    })

    describe('边界条件', () => {
      it('should handle empty result set', () => {
        const params: PaginationParams = { page: 1, limit: 10, offset: 0 }
        const response = createPaginationResponse(params, 0)

        expect(response).toEqual({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        })
      })

      it('should handle single item', () => {
        const params: PaginationParams = { page: 1, limit: 10, offset: 0 }
        const response = createPaginationResponse(params, 1)

        expect(response).toEqual({
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        })
      })

      it('should handle limit larger than total', () => {
        const params: PaginationParams = { page: 1, limit: 100, offset: 0 }
        const response = createPaginationResponse(params, 50)

        expect(response.totalPages).toBe(1)
        expect(response.hasNextPage).toBe(false)
      })

      it('should handle exact page boundary', () => {
        const params: PaginationParams = { page: 5, limit: 20, offset: 80 }
        const response = createPaginationResponse(params, 100) // 刚好5页

        expect(response.totalPages).toBe(5)
        expect(response.hasNextPage).toBe(false)
        expect(response.hasPreviousPage).toBe(true)
      })
    })

    describe('真实场景', () => {
      it('should create response for novels list', () => {
        const params: PaginationParams = { page: 3, limit: 20, offset: 40 }
        const response = createPaginationResponse(params, 156)

        expect(response).toEqual({
          page: 3,
          limit: 20,
          total: 156,
          totalPages: 8,
          hasNextPage: true,
          hasPreviousPage: true,
        })
      })

      it('should create response for API endpoint', () => {
        const params: PaginationParams = { page: 1, limit: 10, offset: 0 }
        const total = 0 // 空结果
        const response = createPaginationResponse(params, total)

        expect(response.total).toBe(0)
        expect(response.totalPages).toBe(0)
      })
    })
  })

  describe('validatePaginationParams() - 验证分页参数', () => {
    describe('有效参数', () => {
      it('should return null for valid params', () => {
        const params: PaginationParams = {
          page: 1,
          limit: 10,
          offset: 0,
        }

        const error = validatePaginationParams(params)
        expect(error).toBeNull()
      })

      it('should accept large valid values', () => {
        const params: PaginationParams = {
          page: 1000,
          limit: 50,
          offset: 49950,
        }

        const error = validatePaginationParams(params)
        expect(error).toBeNull()
      })

      it('should accept limit at maxLimit', () => {
        const params: PaginationParams = {
          page: 1,
          limit: 50,
          offset: 0,
        }

        const error = validatePaginationParams(params, { maxLimit: 50 })
        expect(error).toBeNull()
      })
    })

    describe('无效参数', () => {
      it('should reject page < 1', () => {
        const testCases = [0, -1, -999]

        testCases.forEach(page => {
          const params: PaginationParams = { page, limit: 10, offset: 0 }
          const error = validatePaginationParams(params)
          expect(error).toBe('Page must be greater than 0')
        })
      })

      it('should reject limit < 1', () => {
        const testCases = [0, -1, -999]

        testCases.forEach(limit => {
          const params: PaginationParams = { page: 1, limit, offset: 0 }
          const error = validatePaginationParams(params)
          expect(error).toBe('Limit must be greater than 0')
        })
      })

      it('should reject limit > maxLimit', () => {
        const params: PaginationParams = { page: 1, limit: 100, offset: 0 }
        const error = validatePaginationParams(params, { maxLimit: 50 })
        expect(error).toBe('Limit cannot exceed 50')
      })

      it('should use custom maxLimit', () => {
        const params: PaginationParams = { page: 1, limit: 200, offset: 0 }
        const error = validatePaginationParams(params, { maxLimit: 100 })
        expect(error).toBe('Limit cannot exceed 100')
      })

      it('should use default maxLimit of 50', () => {
        const params: PaginationParams = { page: 1, limit: 51, offset: 0 }
        const error = validatePaginationParams(params)
        expect(error).toBe('Limit cannot exceed 50')
      })
    })

    describe('边界条件', () => {
      it('should accept page = 1', () => {
        const params: PaginationParams = { page: 1, limit: 10, offset: 0 }
        const error = validatePaginationParams(params)
        expect(error).toBeNull()
      })

      it('should accept limit = 1', () => {
        const params: PaginationParams = { page: 1, limit: 1, offset: 0 }
        const error = validatePaginationParams(params)
        expect(error).toBeNull()
      })

      it('should reject page = 0', () => {
        const params: PaginationParams = { page: 0, limit: 10, offset: 0 }
        const error = validatePaginationParams(params)
        expect(error).not.toBeNull()
      })

      it('should reject limit = 0', () => {
        const params: PaginationParams = { page: 1, limit: 0, offset: 0 }
        const error = validatePaginationParams(params)
        expect(error).not.toBeNull()
      })
    })
  })

  describe('集成测试', () => {
    it('should work together for API request', () => {
      const url = 'http://localhost/api/novels?page=3&limit=20'

      // 1. 解析参数
      const params = parsePaginationParams(url)

      // 2. 验证参数
      const error = validatePaginationParams(params)
      expect(error).toBeNull()

      // 3. 创建响应（假设总共156条数据）
      const response = createPaginationResponse(params, 156)

      expect(response).toEqual({
        page: 3,
        limit: 20,
        total: 156,
        totalPages: 8,
        hasNextPage: true,
        hasPreviousPage: true,
      })
    })

    it('should handle invalid params gracefully', () => {
      const url = 'http://localhost/api/novels?page=-1&limit=1000'

      // 解析会自动规范化
      const params = parsePaginationParams(url, { maxLimit: 50 })

      expect(params).toEqual({
        page: 1,   // -1 → 1
        limit: 50, // 1000 → 50
        offset: 0,
      })

      // 验证应该通过
      const error = validatePaginationParams(params)
      expect(error).toBeNull()
    })

    it('should support Prisma pagination pattern', () => {
      const url = 'http://localhost/api/novels?page=2&limit=15'
      const { limit: take, offset: skip } = parsePaginationParams(url)

      // 可以直接用于 Prisma query
      const prismaQuery = {
        take,
        skip,
        where: { isPublished: true },
      }

      expect(prismaQuery).toEqual({
        take: 15,
        skip: 15,
        where: { isPublished: true },
      })
    })
  })
})
