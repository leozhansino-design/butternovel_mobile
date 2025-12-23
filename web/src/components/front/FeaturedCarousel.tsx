// src/components/front/FeaturedCarousel.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Book {
  id: number;
  title: string;
  slug: string;
  coverImage: string;
  description: string;
  category: {
    name: string;
  };
}

export default function FeaturedCarousel({ books }: { books: Book[] }) {
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
  }, [books]);

  // Auto scroll with loop
  useEffect(() => {
    if (isPaused || !trackRef.current) return;

    const interval = setInterval(() => {
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
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

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

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Title area - aligned with first book */}
      <div className="mb-4 sm:mb-6 md:mb-8 px-4 md:px-8 lg:px-[150px]">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
          Featured Novels
        </h2>
      </div>

      {/* Carousel area - extends to screen edge */}
      <div className="relative">
        {/* Left edge gradient mask - 只在可以向左滚动时显示 */}
        {canScrollLeft && (
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 bg-gradient-to-r from-slate-50/80 via-slate-50/60 to-transparent z-10 pointer-events-none lg:w-[120px]" />
        )}

        {/* Right edge gradient mask - hidden on mobile */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 bg-gradient-to-l from-slate-50/80 via-slate-50/60 to-transparent z-10 pointer-events-none lg:w-[120px]" />

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
          className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-8 lg:px-[150px]"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory'
          }}
        >
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/novels/${book.slug}`}
              className="group block flex-shrink-0"
              style={{ width: '120px', scrollSnapAlign: 'start' }}
            >
              {/* Cover container - 3:4 ratio matching 300x400 original */}
              <div className="relative w-full rounded-lg overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow"
                   style={{ aspectRatio: '3/4' }}>
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  fill
                  sizes="120px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Title */}
              <h3
                className="mt-2 font-semibold text-gray-900 group-hover:text-amber-600 transition-colors"
                style={{
                  fontSize: '14px',
                  lineHeight: '1.4',
                  height: '2.8em',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word'
                }}
              >
                {book.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
