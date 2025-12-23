'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { smartTruncate } from '@/lib/utils';

interface TrendingNovel {
  id: number;
  title: string;
  slug: string;
  coverImage: string;
  blurb: string;
  categoryName: string;
  status: string;
  chaptersCount: number;
  rating: number | null;
}

interface TrendingCarouselProps {
  novels: TrendingNovel[];
  autoPlayInterval?: number;
}

export default function TrendingCarousel({
  novels,
  autoPlayInterval = 5000
}: TrendingCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Check scroll position
  const checkScrollPosition = () => {
    if (!trackRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollPosition();
    const track = trackRef.current;
    if (track) {
      track.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
      return () => {
        track.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, [novels]);

  // Auto play with loop
  useEffect(() => {
    if (!isAutoPlaying || !trackRef.current || novels.length === 0) return;

    const timer = setInterval(() => {
      if (trackRef.current) {
        const track = trackRef.current;
        const currentScroll = track.scrollLeft;
        const maxScroll = track.scrollWidth - track.clientWidth;

        if (currentScroll >= maxScroll - 10) {
          // Reached end, loop back to start
          track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Get all card elements
          const cards = track.children;
          if (cards.length === 0) return;

          // Find the next card to scroll to
          let nextCard: Element | null = null;
          for (let i = 0; i < cards.length; i++) {
            const card = cards[i] as HTMLElement;
            const cardLeft = card.offsetLeft - track.offsetLeft;
            if (cardLeft > currentScroll + 10) {
              nextCard = card;
              break;
            }
          }

          if (nextCard) {
            const nextCardElement = nextCard as HTMLElement;
            const scrollToPosition = nextCardElement.offsetLeft - track.offsetLeft;
            track.scrollTo({ left: scrollToPosition, behavior: 'smooth' });
          }
        }
      }
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isAutoPlaying, autoPlayInterval, novels.length]);

  // Scroll by one card with loop support
  const scrollByOneCard = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;

    const track = trackRef.current;
    const currentScroll = track.scrollLeft;
    const maxScroll = track.scrollWidth - track.clientWidth;
    const cards = track.children;

    if (cards.length === 0) return;

    if (direction === 'right') {
      // 如果已经到末尾，循环回到开头
      if (currentScroll >= maxScroll - 10) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      // Find next card
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as HTMLElement;
        const cardLeft = card.offsetLeft - track.offsetLeft;
        if (cardLeft > currentScroll + 10) {
          track.scrollTo({ left: cardLeft, behavior: 'smooth' });
          return;
        }
      }
    } else {
      // 如果已经在开头，循环到末尾
      if (currentScroll <= 10) {
        track.scrollTo({ left: maxScroll, behavior: 'smooth' });
        return;
      }
      // Find previous card
      for (let i = cards.length - 1; i >= 0; i--) {
        const card = cards[i] as HTMLElement;
        const cardLeft = card.offsetLeft - track.offsetLeft;
        if (cardLeft < currentScroll - 10) {
          track.scrollTo({ left: cardLeft, behavior: 'smooth' });
          return;
        }
      }
    }
  };

  if (novels.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-gradient-to-br from-blue-50 via-white to-blue-50/50 py-12 md:py-16 lg:py-20">
      {/* Section Header - consistent with CategoryCarousel */}
      <div className="mb-4 sm:mb-6 md:mb-8 px-4 md:px-8 lg:px-[150px]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            Trending
          </h2>
        </div>
      </div>

      {/* Carousel Wrapper - extends to screen edge */}
      <div
        className="relative"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Left edge gradient mask - 只在可以向左滚动时显示 */}
        {canScrollLeft && (
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-50/80 via-blue-50/60 to-transparent z-10 pointer-events-none lg:w-[120px]" />
        )}

        {/* Right edge gradient mask - hidden on mobile */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 bg-gradient-to-l from-blue-50/80 via-blue-50/60 to-transparent z-10 pointer-events-none lg:w-[120px]" />

        {/* Left navigation button - 循环模式下始终显示 */}
        <button
          onClick={() => scrollByOneCard('left')}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 left-[50px]"
          aria-label="Previous"
        >
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right navigation button - 循环模式下始终显示 */}
        <button
          onClick={() => scrollByOneCard('right')}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 right-[50px]"
          aria-label="Next"
        >
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Novel list - horizontal scroll with snap */}
        <div
          ref={trackRef}
          className="flex gap-3 sm:gap-4 md:gap-5 lg:gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-8 lg:px-[150px]"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory'
          }}
        >
          {novels.map((novel) => (
            <Link
              key={novel.id}
              href={`/novels/${novel.slug}`}
              className="group block flex-shrink-0 w-[320px] sm:w-[400px] md:w-[450px] lg:w-[480px]"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="relative h-full bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-1">
                {/* Card Content */}
                <div className="flex gap-5 p-5 h-full">
                  {/* Cover Image */}
                  <div className="flex-shrink-0">
                    <div
                      className="relative rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow"
                      style={{ width: '150px', height: '200px' }}
                    >
                      <Image
                        src={novel.coverImage}
                        alt={novel.title}
                        fill
                        sizes="150px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Rating Badge - unified style */}
                      {novel.rating && novel.rating > 0 && (
                        <div className="absolute top-2 right-2 z-10 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-lg flex items-center gap-0.5">
                          <svg className="w-2.5 h-2.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-[10px] font-bold text-gray-900">{novel.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Novel Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    {/* Title */}
                    <div>
                      <h3
                        className="text-base md:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2"
                        title={novel.title}
                      >
                        {novel.title}
                      </h3>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                          {novel.categoryName}
                        </span>
                        <span>•</span>
                        <span className={novel.status === 'COMPLETED' ? 'text-green-600 font-medium' : 'text-blue-600 font-medium'}>
                          {novel.status === 'COMPLETED' ? 'Completed' : 'Ongoing'}
                        </span>
                      </div>

                      {/* Blurb - increased to 5 lines */}
                      <p className="text-sm text-gray-700 line-clamp-5 leading-relaxed">
                        {novel.blurb}
                      </p>
                    </div>

                    {/* Read Button */}
                    <div className="mt-3">
                      <div className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm group-hover:gap-3 transition-all">
                        Read Now
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Blue accent border on hover */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
