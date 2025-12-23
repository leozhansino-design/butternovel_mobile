// src/components/admin/NovelSearchBar.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

type Category = {
  id: number
  name: string
}

type Props = {
  categories: Category[]
  initialQuery?: string
}

export default function NovelSearchBar({ categories, initialQuery = '' }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')

  // 防抖搜索（用户停止输入 500ms 后才搜索）
  const debouncedSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams)
    
    if (value) {
      params.set('q', value)
    } else {
      params.delete('q')
    }
    
    params.set('page', '1') // 重置到第一页
    router.push(`/admin/novels?${params.toString()}`)
  }, 500)

  function handleQueryChange(value: string) {
    setQuery(value)
    debouncedSearch(value)
  }

  function handleCategoryChange(value: string) {
    setCategory(value)
    const params = new URLSearchParams(searchParams)
    
    if (value) {
      params.set('category', value)
    } else {
      params.delete('category')
    }
    
    params.set('page', '1')
    router.push(`/admin/novels?${params.toString()}`)
  }

  function handleStatusChange(value: string) {
    setStatus(value)
    const params = new URLSearchParams(searchParams)
    
    if (value) {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    
    params.set('page', '1')
    router.push(`/admin/novels?${params.toString()}`)
  }

  function handleClearFilters() {
    setQuery('')
    setCategory('')
    setStatus('')
    router.push('/admin/novels')
  }

  const hasFilters = query || category || status

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      {/* 搜索框和筛选器 */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by title, author, description..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 分类筛选 */}
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* 状态筛选 */}
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">All Status</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* 清除筛选按钮 */}
      {hasFilters && (
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handleClearFilters}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Clear all filters
          </button>
          <span className="text-sm text-gray-500">
            · Active filters: 
            {query && ' Search'}
            {category && ' Category'}
            {status && ' Status'}
          </span>
        </div>
      )}
    </div>
  )
}