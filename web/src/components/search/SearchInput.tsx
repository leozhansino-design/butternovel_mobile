'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { safeParseJson } from '@/lib/fetch-utils'

interface Suggestion {
  id: number
  title: string
  slug: string
  coverImage: string
  category: string
  isShortNovel: boolean
}

interface SearchInputProps {
  initialValue?: string
  onSearch?: (query: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({
  initialValue = '',
  onSearch,
  placeholder = 'Search by title, author, or description...',
  className = '',
}: SearchInputProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 防抖获取建议
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 至少2个字符才开始搜索
    if (searchQuery.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      setLoading(false)
      return
    }

    setLoading(true)

    // 创建新的AbortController
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`,
        { signal: abortControllerRef.current.signal }
      )

      const data = await safeParseJson(response)

      if (response.ok && data.success) {
        setSuggestions(data.data || [])
        setShowSuggestions(true)
      }
    } catch (error: any) {
      // 忽略取消的请求
      if (error.name !== 'AbortError') {
        console.error('Error fetching suggestions:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // 处理输入变化（带防抖）
  const handleInputChange = (value: string) => {
    setQuery(value)
    setSelectedIndex(-1)

    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 设置新的防抖定时器（300ms）
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 300)
  }

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)

    if (onSearch) {
      onSearch(query)
    } else {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  // Handle suggestion selection - navigate to correct URL based on novel type
  const handleSuggestionClick = (suggestion: Suggestion) => {
    const path = suggestion.isShortNovel ? `/shorts/${suggestion.slug}` : `/novels/${suggestion.slug}`
    router.push(path)
    setShowSuggestions(false)
  }

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault()
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 清理
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
            placeholder={placeholder}
            className="w-full px-3 py-1.5 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-yellow-400 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </form>

      {/* 建议下拉框 - 无封面，更快速 */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-yellow-50' : ''
              }`}
            >
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900 truncate">
                  {suggestion.title}
                </div>
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {suggestion.category}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
