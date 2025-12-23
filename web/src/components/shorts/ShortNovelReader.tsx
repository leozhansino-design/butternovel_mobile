'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { getShortNovelGenreName, formatReadingTime } from '@/lib/short-novel'
import { FormattedParagraph } from '@/components/reader/FormattedText'
import ShortNovelComments from './ShortNovelComments'
import ParagraphCommentButton from '@/components/reader/ParagraphCommentButton'
import ParagraphCommentPanel from '@/components/reader/ParagraphCommentPanel'
import LoginModal from '@/components/shared/LoginModal'

interface Novel {
  id: number
  title: string
  slug: string
  blurb: string
  shortNovelGenre: string | null
  wordCount: number
  viewCount: number
  likeCount: number
  averageRating: number | null
  authorName: string
  status: string
  ratingsCount: number
  commentsCount: number
}

interface Chapter {
  id: number
  content: string
}

interface Rating {
  id: string
  score: number
  review: string | null
  createdAt: Date
  user: {
    id: string
    name: string | null
    avatar: string | null
  }
}

interface ShortNovelReaderProps {
  novel: Novel
  chapter: Chapter
  ratings: Rating[]
  readingTime: number
}

type BgColor = 'white' | 'beige' | 'dark'
type FontSize = 'small' | 'medium' | 'large'

const bgColors = {
  white: { bg: 'bg-white', text: 'text-gray-900', border: 'border-gray-200' },
  beige: { bg: 'bg-[#f5f1e8]', text: 'text-gray-900', border: 'border-blue-100' },
  dark: { bg: 'bg-[#1a1a1a]', text: 'text-gray-100', border: 'border-gray-700' },
}

const fontSizes = {
  small: 'text-base leading-relaxed',
  medium: 'text-lg leading-loose',
  large: 'text-xl leading-loose',
}

export default function ShortNovelReader({
  novel,
  chapter,
  ratings,
  readingTime,
}: ShortNovelReaderProps) {
  const { data: session } = useSession()
  const [bgColor, setBgColor] = useState<BgColor>('white')
  const [fontSize, setFontSize] = useState<FontSize>('medium')
  const [showSettings, setShowSettings] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [isRecommended, setIsRecommended] = useState(false)
  const [recommendCount, setRecommendCount] = useState(novel.likeCount)
  const [ratingsCount, setRatingsCount] = useState(novel.ratingsCount || ratings.length)
  const [isRecommending, setIsRecommending] = useState(false)
  const [showFloatingButton, setShowFloatingButton] = useState(false)
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({})
  const [showLoginModal, setShowLoginModal] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  // Load preferences from localStorage
  useEffect(() => {
    const savedBg = localStorage.getItem('shortsBgColor') as BgColor
    const savedSize = localStorage.getItem('shortsFontSize') as FontSize
    if (savedBg && bgColors[savedBg]) setBgColor(savedBg)
    if (savedSize && fontSizes[savedSize]) setFontSize(savedSize)
  }, [])

  // Show floating button when header is out of view
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const headerRect = headerRef.current.getBoundingClientRect()
        setShowFloatingButton(headerRect.bottom < 0)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch paragraph comment counts
  useEffect(() => {
    const fetchCommentCounts = async () => {
      try {
        const res = await fetch(`/api/paragraph-comments/batch-count?chapterId=${chapter.id}`)
        const data = await res.json()
        if (data.success) {
          setCommentCounts(data.data || {})
        }
      } catch (error) {
        console.error('Failed to fetch comment counts:', error)
      }
    }

    fetchCommentCounts()
  }, [chapter.id])

  // Check if user has already recommended this novel
  useEffect(() => {
    const checkRecommendStatus = async () => {
      try {
        const res = await fetch(`/api/shorts/${novel.id}/recommend-status`)
        const data = await res.json()
        if (data.success) {
          setIsRecommended(data.isRecommended)
        }
      } catch (error) {
        console.error('Failed to check recommend status:', error)
      }
    }

    checkRecommendStatus()
  }, [novel.id])

  // Handle recommend with optimistic update
  const handleRecommend = async () => {
    // Show login modal if user is not logged in
    if (!session?.user) {
      setShowLoginModal(true)
      return
    }

    // Prevent multiple clicks while loading
    if (isRecommending) return

    // Optimistic update - immediately toggle UI state
    const wasRecommended = isRecommended
    const oldCount = recommendCount
    setIsRecommended(!wasRecommended)
    setRecommendCount(wasRecommended ? oldCount - 1 : oldCount + 1)
    setIsRecommending(true)

    try {
      const response = await fetch(`/api/shorts/${novel.id}/recommend`, {
        method: 'POST',
      })
      const data = await response.json()
      if (data.success) {
        // Update with actual server values
        setIsRecommended(data.isRecommended)
        setRecommendCount(data.recommendCount)
      } else {
        // Revert optimistic update on failure
        setIsRecommended(wasRecommended)
        setRecommendCount(oldCount)
        console.error('Recommend failed:', data.message)
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsRecommended(wasRecommended)
      setRecommendCount(oldCount)
      console.error('Failed to recommend:', error)
    } finally {
      setIsRecommending(false)
    }
  }

  const updateBgColor = (color: BgColor) => {
    setBgColor(color)
    localStorage.setItem('shortsBgColor', color)
  }

  const updateFontSize = (size: FontSize) => {
    setFontSize(size)
    localStorage.setItem('shortsFontSize', size)
  }

  // Split content into paragraphs
  const paragraphs = chapter.content
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0)

  // If only one paragraph and it's long, try single newline split
  const finalParagraphs = paragraphs.length === 1 && paragraphs[0].length > 500
    ? chapter.content.split(/\n/).map(p => p.trim()).filter(p => p.length > 0)
    : paragraphs

  // Whether comment panel is open
  const isCommentPanelOpen = activeParagraphIndex !== null

  return (
    <>
      {/* Floating Recommend Button */}
      {showFloatingButton && !isCommentPanelOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleRecommend}
            disabled={isRecommending}
            className={`flex items-center gap-2 px-5 py-3 rounded-full shadow-lg font-medium transition-all ${
              isRecommended
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
            } ${isRecommending ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isRecommending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg
                className={`w-5 h-5 ${isRecommended ? 'fill-current' : ''}`}
                fill={isRecommended ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
            )}
            {isRecommended ? 'Recommended' : 'Recommend'} ({recommendCount.toLocaleString()})
          </button>
        </div>
      )}

      {/* Main container */}
      <div className="relative">
        <article
          className={`rounded-2xl shadow-lg overflow-hidden ${bgColors[bgColor].bg} ${bgColors[bgColor].border} border`}
        >
        {/* Header */}
        <header ref={headerRef} className="px-6 py-8 border-b border-gray-100">
        {/* Back to Shorts */}
        <Link
          href="/shorts"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Shorts
        </Link>

        {/* Genre & Reading Time */}
        <div className="flex items-center gap-3 mb-4">
          {novel.shortNovelGenre && (
            <Link
              href={`/search?type=shorts&genre=${novel.shortNovelGenre}`}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold hover:bg-blue-200 transition-colors"
            >
              {getShortNovelGenreName(novel.shortNovelGenre)}
            </Link>
          )}
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatReadingTime(readingTime)}
          </span>
        </div>

        {/* Title */}
        <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-4 ${bgColors[bgColor].text}`}>
          {novel.title}
        </h1>

        {/* Author & Stats */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <Link
            href={`/search?author=${encodeURIComponent(novel.authorName)}`}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            {novel.authorName}
          </Link>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            {novel.viewCount.toLocaleString()} views
          </span>
          {novel.averageRating && novel.averageRating > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {novel.averageRating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Settings & Recommend Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Reader Settings
          </button>

          {/* Recommend Button */}
          <button
            onClick={handleRecommend}
            disabled={isRecommending}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isRecommended
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            } ${isRecommending ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isRecommending ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg
                className={`w-4 h-4 ${isRecommended ? 'fill-current' : ''}`}
                fill={isRecommended ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
            )}
            {isRecommended ? 'Recommended' : 'Recommend'} ({recommendCount.toLocaleString()})
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
            {/* Background */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
              <div className="flex gap-2">
                {(['white', 'beige', 'dark'] as BgColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => updateBgColor(color)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      bgColor === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                    } ${bgColors[color].bg}`}
                    aria-label={`${color} background`}
                  />
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
              <div className="flex gap-2">
                {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateFontSize(size)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all capitalize ${
                      fontSize === size
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <div ref={contentRef} className={`px-6 py-8 ${bgColors[bgColor].text}`}>
        <div className={`prose prose-lg max-w-none ${fontSizes[fontSize]}`}>
          {finalParagraphs.map((paragraph, index) => (
            <p key={index} className="mb-6 whitespace-pre-wrap">
              <FormattedParagraph content={paragraph} />
              {/* Paragraph comment button - inline at end of paragraph */}
              <span className="inline-block align-middle ml-2">
                <ParagraphCommentButton
                  paragraphIndex={index}
                  onClick={() => setActiveParagraphIndex(activeParagraphIndex === index ? null : index)}
                  isActive={activeParagraphIndex === index}
                  commentCount={commentCounts[index] || 0}
                />
              </span>
            </p>
          ))}
        </div>

        {/* End Mark */}
        <div className="mt-16 mb-8 flex flex-col items-center">
          <div className="w-24 h-px bg-gray-300 mb-6"></div>
          <div className="text-center space-y-2">
            <div className="text-sm tracking-[0.3em] text-gray-400 uppercase font-light">
              The End
            </div>
            <div className="text-xs text-gray-400 font-light italic">
              — Thank you for reading —
            </div>
          </div>
          <div className="w-24 h-px bg-gray-300 mt-6"></div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-6 py-6 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Comment Button */}
            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${
                showComments
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {ratingsCount} Comments
            </button>

            {/* Recommend Button - Bottom */}
            <button
              onClick={handleRecommend}
              disabled={isRecommending}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${
                isRecommended
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              } ${isRecommending ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isRecommending ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg
                  className={`w-5 h-5 ${isRecommended ? 'fill-current' : ''}`}
                  fill={isRecommended ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
              )}
              {isRecommended ? 'Recommended' : 'Recommend'} ({recommendCount.toLocaleString()})
            </button>
          </div>

          {/* Share Button */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: novel.title,
                  text: novel.blurb.substring(0, 100),
                  url: window.location.href,
                })
              } else {
                navigator.clipboard.writeText(window.location.href)
                alert('Link copied to clipboard!')
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Share
          </button>
        </div>
      </div>

        {/* Comments Section */}
        {showComments && (
          <div className="px-6 py-6 border-t border-gray-100">
            <ShortNovelComments
              novelId={novel.id}
              initialRatings={ratings}
              onRatingAdded={() => setRatingsCount(prev => prev + 1)}
            />
          </div>
        )}
        </article>

        {/* Paragraph Comment Panel - Qidian-style (slides in from right, content shifts left) */}
        <div
          className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl border-l border-gray-200 z-[60] transition-transform duration-300 ease-in-out ${
            isCommentPanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Close button at top */}
          <button
            onClick={() => setActiveParagraphIndex(null)}
            className="absolute top-3 right-3 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
            aria-label="Close comments"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {activeParagraphIndex !== null && (
            <ParagraphCommentPanel
              novelId={novel.id}
              chapterId={chapter.id}
              paragraphIndex={activeParagraphIndex}
              onClose={() => setActiveParagraphIndex(null)}
              bgColor="bg-white"
              textColor="text-gray-900"
            />
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  )
}
