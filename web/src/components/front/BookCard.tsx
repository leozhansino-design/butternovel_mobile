// src/components/front/BookCard.tsx
// PERFORMANCE: Added React.memo to reduce unnecessary re-renders
import { memo } from 'react'
import Link from 'next/link'
import NovelCover from '././NovelCover'

interface BookCardProps {
  id: number
  title: string
  coverImage?: string
  category: string
  status: string
  chapters: number
  likes: number
  slug?: string
}

const BookCard = memo(function BookCard({
  id,
  title,
  coverImage,
  category,
  status,
  chapters,
  likes,
  slug
}: BookCardProps) {
  const cover = coverImage || `https://images.unsplash.com/photo-${1544947950 + id}?w=300&h=450&fit=crop`
  const bookLink = slug ? `/novels/${slug}` : `/novels/book-${id}`
  
  return (
    <Link
      href={bookLink}
      className="group block"
    >
      <NovelCover 
        src={cover}
        alt={title}
      />

      <div className="mt-2 sm:mt-3">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-[var(--text-muted)] mb-1.5 sm:mb-2">
          <span className="px-1.5 sm:px-2.5 py-0.5 bg-[#fffae6] text-[#b39320] rounded-full font-medium truncate">
            {category}
          </span>
          <span className="text-gray-400">•</span>
          <span className="truncate">{chapters} ch</span>
        </div>

        {/* Mobile-optimized title display */}
        <h3
          className="font-semibold text-[var(--text-primary)] mb-1.5 sm:mb-2 group-hover:text-[#b39320] transition-colors text-sm sm:text-base"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.3rem',
            height: '2.6rem',
          }}
        >
          {title}
        </h3>

        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-1 sm:gap-1.5 text-[var(--text-secondary)]">
            <span className="text-sm sm:text-base">👍</span>
            <span className="font-medium">{likes.toLocaleString()}</span>
          </div>
          {status === 'COMPLETED' ? (
            <span className="text-emerald-600 text-[10px] sm:text-xs font-medium">✓ Done</span>
          ) : (
            <span className="text-blue-600 text-[10px] sm:text-xs font-medium">📝 On</span>
          )}
        </div>
      </div>
    </Link>
  )
})

export default BookCard