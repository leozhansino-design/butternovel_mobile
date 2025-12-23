// src/components/search/EnhancedBookCard.tsx
'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Tag {
  id: string
  name: string
  slug: string
}

interface Category {
  id: number
  name: string
  slug: string
}

interface EnhancedBookCardProps {
  id: number
  title: string
  slug: string
  coverImage: string
  authorName: string
  blurb: string
  viewCount: number
  averageRating?: number | null
  totalRatings: number
  status: string
  category: Category
  tags: Tag[]
  tagsCount: number
  chaptersCount: number
  likesCount?: number // For shorts, this represents recommendCount
  isShortNovel?: boolean
}

// Default cover component for short novels without covers
const ShortNovelDefaultCover = ({ title }: { title: string }) => {
  // Generate a consistent color based on title
  const getColorFromTitle = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    // Generate soft, elegant colors
    const hue = Math.abs(hash) % 360
    return {
      primary: `hsl(${hue}, 45%, 65%)`,
      secondary: `hsl(${(hue + 30) % 360}, 50%, 55%)`,
    }
  }

  const colors = getColorFromTitle(title)

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: `linear-gradient(145deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
      }}
    />
  )
}

const EnhancedBookCard = memo(function EnhancedBookCard({
  id,
  title,
  slug,
  coverImage,
  authorName,
  blurb,
  viewCount,
  averageRating,
  totalRatings,
  status,
  category,
  tags,
  tagsCount,
  chaptersCount,
  likesCount = 0,
  isShortNovel = false,
}: EnhancedBookCardProps) {
  // Determine the correct URL path based on novel type
  const novelUrl = isShortNovel ? `/shorts/${slug}` : `/novels/${slug}`
  // 格式化数字（K/M）
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  // 智能显示标签：移动端显示更少
  const calculateDisplayTags = (isMobile: boolean) => {
    if (tags.length === 0) return []
    if (isMobile) {
      // 移动端只显示2个标签
      return tags.slice(0, 2)
    }

    // 计算前3个标签的总字符长度
    const firstThree = tags.slice(0, 3)
    const totalLength = firstThree.reduce((sum, tag) => sum + tag.name.length, 0)

    // 如果3个标签总长度超过30个字符，只显示2个避免溢出
    // 否则显示3个
    return totalLength > 30 ? tags.slice(0, 2) : tags.slice(0, 3)
  }

  const displayedTagsMobile = calculateDisplayTags(true)
  const displayedTagsDesktop = calculateDisplayTags(false)
  const remainingTagsCountMobile = tagsCount - displayedTagsMobile.length
  const remainingTagsCountDesktop = tagsCount - displayedTagsDesktop.length

  // 状态显示文本
  const statusText = status === 'COMPLETED' ? 'Completed' : 'Ongoing'
  const statusColor = status === 'COMPLETED' ? 'text-green-600' : 'text-blue-600'

  return (
    <div className="h-full bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200">
      {/* 水平卡片布局 - 填满网格单元高度 */}
      <div className="flex h-full">
        {/* 左侧：封面图片 - 宽度固定，高度跟随卡片 */}
        <Link href={novelUrl} className="flex-shrink-0 relative group w-24 sm:w-32 md:w-40 lg:w-44">
          {isShortNovel && !coverImage ? (
            <ShortNovelDefaultCover title={title} />
          ) : (
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover group-hover:opacity-90 transition-opacity"
              sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 176px"
            />
          )}
        </Link>

        {/* 右侧：所有文字信息 - 自然流式布局 */}
        <div className="flex-1 p-2.5 sm:p-4 md:p-5 lg:p-6 flex flex-col min-w-0">
          {/* 上部分：标题、作者、统计信息 */}
          <div className="flex flex-col">
            {/* 标题 - 移动端更紧凑 */}
            <Link
              href={novelUrl}
              className="font-bold text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl hover:text-blue-600 transition-colors mb-0.5 sm:mb-1 line-clamp-2 leading-tight"
            >
              {title}
            </Link>

            {/* 作者 */}
            <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1 truncate">
              by <span className="font-medium">{authorName}</span>
            </p>

            {/* 统计信息 - 移动端单行紧凑 */}
            <div className="flex items-center flex-wrap gap-x-2 sm:gap-x-3 gap-y-0.5 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
              {/* Recommend count for shorts */}
              {isShortNovel && likesCount > 0 && (
                <span className="flex items-center gap-0.5 text-blue-600 font-medium">
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  {formatNumber(likesCount)}
                </span>
              )}
              <span>{formatNumber(viewCount)}</span>
              {averageRating && totalRatings > 0 && (
                <span>★{averageRating.toFixed(1)}</span>
              )}
              <span>{chaptersCount}ch</span>
              <span className={`font-semibold ${statusColor}`}>{statusText}</span>
            </div>

            {/* 简介 - 移动端2行，平板以上3行 */}
            <p className="text-[11px] sm:text-sm md:text-base text-gray-600 sm:text-gray-700 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-2 md:line-clamp-3">
              {blurb}
            </p>
          </div>

          {/* 标签区域 - 自然排列，顶部间距 */}
          {tags.length > 0 && (
            <>
              {/* 移动端标签 */}
              <div className="flex sm:hidden gap-1 items-center flex-wrap mt-2 min-w-0">
                {displayedTagsMobile.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/search?tags=${tag.slug}`}
                    className="inline-block px-1.5 py-0.5 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded text-[10px] font-medium transition-colors whitespace-nowrap overflow-hidden text-ellipsis shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxWidth: '80px' }}
                  >
                    {tag.name}
                  </Link>
                ))}
                {remainingTagsCountMobile > 0 && (
                  <span className="inline-block px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-medium whitespace-nowrap shrink-0">
                    +{remainingTagsCountMobile}
                  </span>
                )}
                {/* Rating next to tags - mobile */}
                {averageRating && totalRatings > 0 && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-medium whitespace-nowrap shrink-0 ml-auto">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {averageRating.toFixed(1)}
                  </span>
                )}
              </div>

              {/* 平板以上标签 */}
              <div className="hidden sm:flex gap-1.5 md:gap-2 items-center flex-wrap mt-2 md:mt-3 min-w-0">
                {displayedTagsDesktop.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/search?tags=${tag.slug}`}
                    className="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-full text-xs md:text-sm font-medium transition-colors whitespace-nowrap overflow-hidden text-ellipsis shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    title={tag.name}
                    style={{ maxWidth: '150px' }}
                  >
                    {tag.name}
                  </Link>
                ))}
                {remainingTagsCountDesktop > 0 && (
                  <span className="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-gray-50 text-gray-500 rounded-full text-xs md:text-sm font-medium whitespace-nowrap shrink-0">
                    +{remainingTagsCountDesktop} more
                  </span>
                )}
                {/* Rating next to tags - desktop */}
                {averageRating && totalRatings > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 bg-amber-50 text-amber-700 rounded-full text-xs md:text-sm font-medium whitespace-nowrap shrink-0 ml-auto">
                    <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {averageRating.toFixed(1)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
})

export default EnhancedBookCard
