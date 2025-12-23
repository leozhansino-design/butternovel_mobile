// src/components/novel/ChapterPreview.tsx
// First chapter preview component - shows 200-300 characters with gradient effect
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

type ChapterPreviewProps = {
  chapterId: number
  chapterNumber: number
  chapterTitle: string
  novelSlug: string
}

async function getChapterContent(chapterId: number) {
  // 🔧 FIX: Only run database queries in Node.js environment
  if (typeof window !== 'undefined' || !prisma) {
    console.warn('ChapterPreview: Skipping database query (client-side or prisma unavailable)');
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

/**
 * Truncate to specified character count
 * Chinese characters count as 1, English words count as 1
 */
function truncateByWords(text: string, wordCount: number): string {
  // Remove extra whitespace
  const cleaned = text.trim()

  let count = 0
  let result = ''

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]

    // Chinese characters (CJK Unified Ideographs)
    if (/[\u4e00-\u9fa5]/.test(char)) {
      count++
      result += char
      if (count >= wordCount) break
    }
    // English characters
    else if (/[a-zA-Z]/.test(char)) {
      // Read entire English word
      let word = char
      while (i + 1 < cleaned.length && /[a-zA-Z]/.test(cleaned[i + 1])) {
        i++
        word += cleaned[i]
      }
      count++
      result += word
      if (count >= wordCount) break
    }
    // Other characters (punctuation, spaces, etc.) add directly
    else {
      result += char
    }
  }

  return result
}

export default async function ChapterPreview({
  chapterId,
  chapterNumber,
  chapterTitle,
  novelSlug,
}: ChapterPreviewProps) {
  const content = await getChapterContent(chapterId)

  if (!content) {
    return null
  }

  // Truncate to around 250 characters
  const preview = truncateByWords(content, 250)

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Chapter title */}
          <div className="mb-10">
            <div className="text-sm text-blue-600 mb-2 font-semibold tracking-wider">
              CHAPTER {chapterNumber}
            </div>
            <h3 className="text-4xl font-bold text-gray-900">
              {chapterTitle}
            </h3>
          </div>

          {/* Content preview area - with gradient mask */}
          <div className="relative">
            {/* Preview content */}
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {preview}
              </div>
            </div>

            {/* Gradient mask effect - fade out downward */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none" />
          </div>

          {/* Continue Reading button - blue theme */}
          <div className="mt-10 text-center">
            <Link
              href={`/novels/${novelSlug}/chapters/${chapterNumber}`}
              className="btn-primary inline-flex items-center gap-3 px-10 py-4 text-white font-semibold rounded-xl text-lg hover:scale-[1.02]"
            >
              Continue Reading
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
