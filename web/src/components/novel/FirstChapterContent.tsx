// src/components/novel/FirstChapterContent.tsx
// Lazy loading component - async fetch chapter content, doesn't block initial render
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

type FirstChapterContentProps = {
  chapterId: number
  chapterNumber: number
  chapterTitle: string
  novelSlug: string
  hasSecondChapter: boolean
  secondChapterNumber?: number
  novelStatus: 'ONGOING' | 'COMPLETED'
}

async function getChapterContent(chapterId: number) {
  // 🔧 FIX: Only run database queries in Node.js environment
  if (typeof window !== 'undefined' || !prisma) {
    console.warn('FirstChapterContent: Skipping database query (client-side or prisma unavailable)');
    return null;
  }

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: {
      content: true,
    },
  })
  return chapter?.content || null
}

export default async function FirstChapterContent({
  chapterId,
  chapterNumber,
  chapterTitle,
  novelSlug,
  hasSecondChapter,
  secondChapterNumber,
  novelStatus,
}: FirstChapterContentProps) {
  const content = await getChapterContent(chapterId)

  if (!content) {
    return null
  }

  return (
    <section className="pt-6 pb-12 md:pb-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center border-b border-gray-200 pb-8">
            <div className="text-sm text-gray-500 mb-4 font-medium tracking-wider uppercase">
              Chapter {chapterNumber}
            </div>
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900">
              {chapterTitle}
            </h3>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="text-gray-800 text-lg leading-loose whitespace-pre-wrap">
              {content}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-10 text-center">
            {hasSecondChapter ? (
              <Link
                href={`/novels/${novelSlug}/chapters/${secondChapterNumber}`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-[#f4d03f] via-[#e8b923] to-[#d4a017] hover:from-[#f5d85a] hover:via-[#f4d03f] hover:to-[#e8b923] text-white font-semibold rounded-lg transition-all shadow-[0_4px_12px_rgba(228,185,35,0.4)] hover:shadow-[0_6px_20px_rgba(228,185,35,0.5)] text-lg"
              >
                Continue Reading
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            ) : (
              <div className="text-gray-500 text-lg">
                {novelStatus === 'COMPLETED' ? 'This is the final chapter' : 'More chapters coming soon...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
