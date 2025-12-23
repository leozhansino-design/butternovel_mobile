'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { normalizeTag, TAG_LIMITS } from '@/lib/tags'
import { safeParseJson } from '@/lib/fetch-utils'

interface TagSuggestion {
  name: string
  slug: string
  count: number
}

interface TagsInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  className?: string
  disabled?: boolean
}

export default function TagsInput({
  value = [],
  onChange,
  placeholder = 'Add tags (press space or enter)',
  maxTags = TAG_LIMITS.MAX_TAGS,
  className = '',
  disabled = false
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const isMaxTagsReached = value.length >= maxTags

  // Debounced fetch suggestions
  useEffect(() => {
    if (!inputValue.trim() || inputValue.includes(' ')) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true)
      try {
        const response = await fetch(`/api/tags/suggest?q=${encodeURIComponent(inputValue)}`)
        if (response.ok) {
          const data = await safeParseJson(response)
          setSuggestions(data || [])
          setShowSuggestions(data && data.length > 0 && !data.error)
        }
      } catch (error) {
        console.error('Failed to fetch tag suggestions:', error)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [inputValue])

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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

  const addTag = useCallback((tag: string) => {
    const normalized = normalizeTag(tag)

    // Validation
    if (!normalized) return
    if (normalized.length > TAG_LIMITS.MAX_TAG_LENGTH) {
      alert(`Tag length cannot exceed ${TAG_LIMITS.MAX_TAG_LENGTH} characters`)
      return
    }
    if (value.includes(normalized)) {
      alert('This tag already exists')
      return
    }
    if (value.length >= maxTags) {
      alert(`You can add up to ${maxTags} tags`)
      return
    }

    onChange([...value, normalized])
    setInputValue('')
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)
  }, [value, onChange, maxTags])

  const removeTag = useCallback((tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }, [value, onChange])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Space or Enter to add tag
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()

      // If a suggestion is selected, use it
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        addTag(suggestions[selectedSuggestionIndex].name)
      } else if (inputValue.trim()) {
        addTag(inputValue)
      }
    }

    // Backspace on empty input removes last tag
    else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }

    // Arrow keys for suggestion navigation
    else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault()
      setSelectedSuggestionIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    }
    else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1))
    }

    // Escape to close suggestions
    else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedSuggestionIndex(-1)
    }
  }

  const handleSuggestionClick = (suggestion: TagSuggestion) => {
    addTag(suggestion.name)
    inputRef.current?.focus()
  }

  return (
    <div className={`${className}`}>
      <div className="relative">
        {/* Tags Display + Input */}
        <div
          className={`flex flex-wrap gap-2 p-3 border rounded-lg bg-white min-h-[52px] ${
            disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-text'
          } ${isMaxTagsReached ? 'border-orange-300' : 'border-gray-300'} focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500`}
          onClick={() => !disabled && inputRef.current?.focus()}
        >
          {/* Tag Chips */}
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTag(tag)
                  }}
                  className="ml-1 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${tag}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </span>
          ))}

          {/* Input Field */}
          {!isMaxTagsReached && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true)
              }}
              placeholder={value.length === 0 ? placeholder : ''}
              disabled={disabled}
              className="flex-1 min-w-[200px] outline-none bg-transparent text-gray-700 placeholder-gray-400 disabled:cursor-not-allowed"
            />
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && !disabled && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.slug}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors ${
                  index === selectedSuggestionIndex ? 'bg-indigo-100' : ''
                } ${index === 0 ? 'rounded-t-lg' : ''} ${
                  index === suggestions.length - 1 ? 'rounded-b-lg' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-800 font-medium">{suggestion.name}</span>
                  <span className="text-gray-500 text-sm">({suggestion.count})</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Loading Indicator */}
        {isLoadingSuggestions && inputValue && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-2 flex items-start justify-between text-sm">
        <p className="text-gray-500">
          Press space or enter to add tags · Max {maxTags} tags
        </p>
        <p className={`font-medium ${isMaxTagsReached ? 'text-orange-600' : 'text-gray-600'}`}>
          {value.length} / {maxTags}
        </p>
      </div>

      {/* Max Tags Warning */}
      {isMaxTagsReached && (
        <p className="mt-1 text-sm text-orange-600 flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-orange-600 rounded-full"></span>
          Maximum tag limit reached
        </p>
      )}
    </div>
  )
}
