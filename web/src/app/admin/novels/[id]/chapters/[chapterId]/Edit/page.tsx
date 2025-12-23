// src/app/admin/novels/[id]/chapters/[chapterId]/edit/page.tsx
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { getAdminSession } from '@/lib/admin-auth'
import { redirect, notFound } from 'next/navigation'
import ChapterForm from '@/components/admin/ChapterForm'

type Props = {
  params: Promise<{ id: string; chapterId: string }>
}

export default async function EditChapterPage(props: Props) {
  const params = await props.params
  
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }

  const novelId = parseInt(params.id)
  const chapterId = parseInt(params.chapterId)
  
  if (isNaN(novelId) || isNaN(chapterId)) {
    notFound()
  }

  // 🔄 添加数据库重试机制，解决连接超时问题
  const chapter = await withRetry(
    () => prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        novelId: true,
        title: true,
        content: true,
        chapterNumber: true,
        wordCount: true,
        novel: {
          select: { id: true, title: true }
        }
      }
    }),
    { operationName: 'Get chapter for edit page' }
  ) as any

  if (!chapter || chapter.novelId !== novelId) {
    notFound()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Chapter</h1>
        <p className="text-gray-600 mt-1">Novel: {chapter.novel.title}</p>
      </div>
      <ChapterForm
        mode="edit"
        novelId={chapter.novelId}
        novelTitle={chapter.novel.title}
        chapterNumber={chapter.chapterNumber}
        initialData={{
          id: chapter.id,
          title: chapter.title,
          content: chapter.content,
          isPublished: chapter.isPublished
        }}
      />
    </div>
  )
}