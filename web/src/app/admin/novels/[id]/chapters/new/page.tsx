// src/app/admin/novels/[id]/chapters/new/page.tsx
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { getAdminSession } from '@/lib/admin-auth'
import { redirect, notFound } from 'next/navigation'
import ChapterForm from '@/components/admin/ChapterForm'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AddChapterPage(props: Props) {
  const params = await props.params
  
  // 验证管理员权限
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }

  const novelId = parseInt(params.id)
  
  if (isNaN(novelId)) {
    notFound()
  }

  // 获取小说信息
  // 🔄 添加数据库重试机制，解决连接超时问题
  const novel = await withRetry(
    () => prisma.novel.findUnique({
      where: { id: novelId },
      select: {
        id: true,
        title: true,
        _count: {
          select: { chapters: true }
        }
      }
    }),
    { operationName: 'Get novel for add chapter page' }
  ) as any

  if (!novel) {
    notFound()
  }

  // 计算下一个章节号
  const nextChapterNumber = novel._count.chapters + 1

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Chapter</h1>
        <p className="text-gray-600 mt-1">
          Novel: {novel.title} · Chapter {nextChapterNumber}
        </p>
      </div>

      <ChapterForm
        mode="create"
        novelId={novelId}
        chapterNumber={nextChapterNumber}
        novelTitle={novel.title}
      />
    </div>
  )
}