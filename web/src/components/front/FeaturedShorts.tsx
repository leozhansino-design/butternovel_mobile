'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { formatReadingTime, estimateReadingTime, getShortNovelGenreName } from '@/lib/short-novel'

interface ShortNovel {
  id: number
  title: string
  slug: string
  blurb: string
  readingPreview: string | null
  shortNovelGenre: string | null
  wordCount: number
  viewCount: number
  likeCount: number
  averageRating: number | null
}

interface FeaturedShortsProps {
  novels: ShortNovel[]
  autoPlayInterval?: number
}

export default function FeaturedShorts({
  novels,
  autoPlayInterval = 7000
}: FeaturedShortsProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const checkScrollPosition = () => {
    if (!trackRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    checkScrollPosition()
    const track = trackRef.current
    if (track) {
      track.addEventListener('scroll', checkScrollPosition)
      window.addEventListener('resize', checkScrollPosition)
      return () => {
        track.removeEventListener('scroll', checkScrollPosition)
        window.removeEventListener('resize', checkScrollPosition)
      }
    }
  }, [novels])

  useEffect(() => {
    if (!isAutoPlaying || !trackRef.current || novels.length === 0) return

    const timer = setInterval(() => {
      if (trackRef.current) {
        const track = trackRef.current
        const currentScroll = track.scrollLeft
        const maxScroll = track.scrollWidth - track.clientWidth

        if (currentScroll >= maxScroll - 10) {
          track.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          const cards = track.children
          if (cards.length === 0) return

          let nextCard: Element | null = null
          for (let i = 0; i < cards.length; i++) {
            const card = cards[i] as HTMLElement
            const cardLeft = card.offsetLeft - track.offsetLeft
            if (cardLeft > currentScroll + 10) {
              nextCard = card
              break
            }
          }

          if (nextCard) {
            const nextCardElement = nextCard as HTMLElement
            const scrollToPosition = nextCardElement.offsetLeft - track.offsetLeft
            track.scrollTo({ left: scrollToPosition, behavior: 'smooth' })
          }
        }
      }
    }, autoPlayInterval)

    return () => clearInterval(timer)
  }, [isAutoPlaying, autoPlayInterval, novels.length])

  const scrollByOneCard = (direction: 'left' | 'right') => {
    if (!trackRef.current) return

    const track = trackRef.current
    const currentScroll = track.scrollLeft
    const maxScroll = track.scrollWidth - track.clientWidth
    const cards = track.children

    if (cards.length === 0) return

    if (direction === 'right') {
      if (currentScroll >= maxScroll - 10) {
        track.scrollTo({ left: 0, behavior: 'smooth' })
        return
      }
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as HTMLElement
        const cardLeft = card.offsetLeft - track.offsetLeft
        if (cardLeft > currentScroll + 10) {
          track.scrollTo({ left: cardLeft, behavior: 'smooth' })
          return
        }
      }
    } else {
      if (currentScroll <= 10) {
        track.scrollTo({ left: maxScroll, behavior: 'smooth' })
        return
      }
      for (let i = cards.length - 1; i >= 0; i--) {
        const card = cards[i] as HTMLElement
        const cardLeft = card.offsetLeft - track.offsetLeft
        if (cardLeft < currentScroll - 10) {
          track.scrollTo({ left: cardLeft, behavior: 'smooth' })
          return
        }
      }
    }
  }

  if (novels.length === 0) {
    return null
  }

  return (
    <section className="w-full bg-white py-10 md:py-14 lg:py-16">
      {/* Section Header */}
      <div className="mb-4 sm:mb-6 md:mb-8 px-4 md:px-8 lg:px-[150px]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              Featured Shorts
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Discover new quick reads</p>
          </div>
          <Link
            href="/shorts"
            className="hidden sm:flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Carousel */}
      <div
        className="relative"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {canScrollLeft && (
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 bg-gradient-to-r from-white via-white/60 to-transparent z-10 pointer-events-none lg:w-[120px]" />
        )}

        <div className="hidden lg:block absolute right-0 top-0 bottom-0 bg-gradient-to-l from-white via-white/60 to-transparent z-10 pointer-events-none lg:w-[120px]" />

        <button
          onClick={() => scrollByOneCard('left')}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 left-[50px] border border-gray-100"
          aria-label="Previous"
        >
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => scrollByOneCard('right')}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 right-[50px] border border-gray-100"
          aria-label="Next"
        >
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Cards */}
        <div
          ref={trackRef}
          className="flex gap-4 sm:gap-5 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-8 lg:px-[150px]"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory'
          }}
        >
          {novels.map((novel) => {
            const readingTime = estimateReadingTime(novel.wordCount)
            const previewText = novel.readingPreview || novel.blurb
            const maxPreviewLength = 320

            return (
              <Link
                key={novel.id}
                href={`/shorts/${novel.slug}`}
                className="group block flex-shrink-0 w-[300px] sm:w-[340px] md:w-[380px] lg:w-[400px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Fixed Height Card with Flex Layout */}
                <div className="relative h-[320px] sm:h-[340px] flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-1">
                  <div className="relative p-5 sm:p-6 flex flex-col h-full">
                    {/* Genre & Reading Time - Fixed */}
                    <div className="flex items-center justify-between mb-3">
                      {novel.shortNovelGenre && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                          {getShortNovelGenreName(novel.shortNovelGenre)}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatReadingTime(readingTime)}
                      </span>
                    </div>

                    {/* Title - Fixed Height (2 lines max) */}
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-3 line-clamp-2 leading-tight h-[48px] sm:h-[56px]">
                      {novel.title.length > 80 ? novel.title.substring(0, 80) + '...' : novel.title}
                    </h3>

                    {/* Preview Text - Flexible, fills remaining space */}
                    <div className="flex-1 overflow-hidden mb-4">
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-5">
                        {previewText.length > maxPreviewLength ? (
                          <>
                            {previewText.substring(0, maxPreviewLength)}
                            <span className="text-blue-600 font-medium"> ...more</span>
                          </>
                        ) : (
                          previewText
                        )}
                      </p>
                    </div>

                    {/* Stats & Read More - Fixed at bottom */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {novel.viewCount.toLocaleString()}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1.5 text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                        Read →
                      </span>
                    </div>
                  </div>

                  {/* Accent line on hover */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Mobile View All */}
      <div className="sm:hidden mt-6 px-4">
        <Link
          href="/shorts"
          className="block w-full py-3 text-center bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
        >
          View All Shorts
        </Link>
      </div>
    </section>
  )
}
