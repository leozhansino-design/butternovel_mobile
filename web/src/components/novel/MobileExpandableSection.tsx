// src/components/novel/MobileExpandableSection.tsx
// 移动端可展开/收起的区域组件
'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Tag {
  id: number
  name: string
  slug: string
}

interface MobileExpandableSectionProps {
  blurb: string
  tags: Tag[]
}

export default function MobileExpandableSection({ blurb, tags }: MobileExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasMoreTags = tags.length > 4
  const hasLongBlurb = blurb.length > 150

  // 如果内容很短，不需要展开功能
  if (!hasMoreTags && !hasLongBlurb) {
    return (
      <>
        {/* 标签区域 */}
        {tags.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Link key={tag.slug} href={`/search?tags=${tag.slug}`}>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                    {tag.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 简介 */}
        <div className="mt-3">
          <p className="text-gray-700 text-sm leading-relaxed">
            {blurb}
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      {/* 标签区域 */}
      {tags.length > 0 && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1.5">
            {(isExpanded ? tags : tags.slice(0, 4)).map((tag) => (
              <Link key={tag.slug} href={`/search?tags=${tag.slug}`}>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                  {tag.name}
                </span>
              </Link>
            ))}
            {!isExpanded && hasMoreTags && (
              <button
                onClick={() => setIsExpanded(true)}
                className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
              >
                +{tags.length - 4} more
              </button>
            )}
          </div>
        </div>
      )}

      {/* 简介 */}
      <div className="mt-3">
        <p className={`text-gray-700 text-sm leading-relaxed ${!isExpanded && hasLongBlurb ? 'line-clamp-3' : ''}`}>
          {blurb}
        </p>

        {/* 展开/收起按钮 */}
        {(hasMoreTags || hasLongBlurb) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-blue-600 text-xs font-medium flex items-center gap-1 hover:text-blue-700 transition-colors"
          >
            {isExpanded ? (
              <>
                <span>Show less</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                <span>Show more</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
    </>
  )
}
