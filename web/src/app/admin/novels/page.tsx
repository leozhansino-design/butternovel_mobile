// src/app/admin/novels/page.tsx
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { getAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import NovelSearchBar from '@/components/admin/NovelSearchBar'
import BanButton from '@/components/admin/BanButton'  // ⭐ 加这行

type Props = {
  searchParams: Promise<{
    q?: string
    page?: string
    category?: string
    status?: string
    type?: string  // 'all' | 'regular' | 'short'
  }>
}

export default async function ManageNovelsPage(props: Props) {
  const searchParams = await props.searchParams

  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }

  const query = searchParams.q || ''
  const currentPage = parseInt(searchParams.page || '1')
  const pageSize = 10

  const where: any = {}

  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { authorName: { contains: query, mode: 'insensitive' } },
      { blurb: { contains: query, mode: 'insensitive' } },
    ]
  }

  if (searchParams.category) {
    where.categoryId = parseInt(searchParams.category)
  }

  if (searchParams.status) {
    where.status = searchParams.status
  }

  // 短篇/普通小说筛选
  const novelType = searchParams.type || 'all'
  if (novelType === 'short') {
    where.isShortNovel = true
  } else if (novelType === 'regular') {
    where.isShortNovel = false
  }

  // 🔄 添加数据库重试机制，解决连接超时问题
  const [novels, total] = await Promise.all([
    withRetry(
      () => prisma.novel.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          authorName: true,
          status: true,
          createdAt: true,
          isBanned: true,
          isShortNovel: true,
          shortNovelGenre: true,
          category: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              chapters: true,
              likes: true,
              comments: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      }),
      { operationName: 'Get novels list for admin' }
    ) as any,
    withRetry(
      () => prisma.novel.count({ where }),
      { operationName: 'Count novels for admin' }
    ) as any,
  ])

  const totalPages = Math.ceil(total / pageSize)

  // 🔄 添加数据库重试机制，解决连接超时问题
  const categories = await withRetry(
    () => prisma.category.findMany({
      orderBy: { order: 'asc' }
    }),
    { operationName: 'Get categories for admin novels page' }
  ) as any

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Novels</h1>
          <p className="text-gray-600 mt-1">Search, edit, and manage all novels</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/batch-upload-shorts"
            className="px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
          >
            + Batch Upload Shorts
          </Link>
          <Link
            href="/admin/novels/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Upload New Novel
          </Link>
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Link
          href={`/admin/novels?${new URLSearchParams({
            ...(query && { q: query }),
            ...(searchParams.category && { category: searchParams.category }),
            ...(searchParams.status && { status: searchParams.status }),
          }).toString()}`}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            novelType === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Novels
        </Link>
        <Link
          href={`/admin/novels?${new URLSearchParams({
            ...(query && { q: query }),
            ...(searchParams.category && { category: searchParams.category }),
            ...(searchParams.status && { status: searchParams.status }),
            type: 'regular',
          }).toString()}`}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            novelType === 'regular'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Regular Novels
        </Link>
        <Link
          href={`/admin/novels?${new URLSearchParams({
            ...(query && { q: query }),
            ...(searchParams.category && { category: searchParams.category }),
            ...(searchParams.status && { status: searchParams.status }),
            type: 'short',
          }).toString()}`}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            novelType === 'short'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Short Novels
        </Link>
      </div>

      <NovelSearchBar
        categories={categories}
        initialQuery={query}
      />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-900">
          Found <strong className="font-bold">{total}</strong> novel{total !== 1 ? 's' : ''}
          {query && ` matching "${query}"`}
          {' · '}Page {currentPage} of {totalPages}
        </p>
      </div>

      {novels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No novels found</p>
          {query && (
            <Link
              href="/admin/novels"
              className="text-blue-600 hover:underline mt-2 inline-block"
            >
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Novel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {novels.map((novel: any) => (
                <tr key={novel.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 max-w-xs">
                    <div className="flex items-center gap-3">
                      {novel.isShortNovel ? (
                        <div className="w-12 h-16 flex-shrink-0 rounded bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      ) : (
                        <div className="relative w-12 h-16 flex-shrink-0">
                          {novel.coverImage ? (
                            <Image
                              src={novel.coverImage}
                              alt={novel.title}
                              fill
                              sizes="48px"
                              className="rounded object-cover"
                            />
                          ) : (
                            <div className="w-full h-full rounded bg-gray-200 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate max-w-[200px]">
                          {novel.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {novel.isShortNovel && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              SHORT
                            </span>
                          )}
                          {novel.isBanned && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              BANNED
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {novel.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{novel.authorName}</div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {novel.category.name}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${novel.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {novel.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div>📚 {novel._count.chapters} chapters</div>
                      <div className="text-gray-500">
                        👍 {novel._count.likes} · 💬 {novel._count.comments}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {new Date(novel.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right w-64">
                    <div className="flex justify-end gap-2 flex-nowrap">
                      <Link
                        href={`/admin/novels/${novel.id}/edit`}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        Edit
                      </Link>
                      <Link
                        href={novel.isShortNovel ? `/shorts/${novel.slug}` : `/novels/${novel.slug}`}
                        target="_blank"
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors whitespace-nowrap"
                      >
                        View
                      </Link>
                      <BanButton novelId={novel.id} isBanned={novel.isBanned} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} results
          </div>

          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/admin/novels?${new URLSearchParams({
                  ...(query && { q: query }),
                  ...(searchParams.category && { category: searchParams.category }),
                  ...(searchParams.status && { status: searchParams.status }),
                  page: String(currentPage - 1)
                }).toString()}`}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Previous
              </Link>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <Link
                    key={page}
                    href={`/admin/novels?${new URLSearchParams({
                      ...(query && { q: query }),
                      ...(searchParams.category && { category: searchParams.category }),
                      ...(searchParams.status && { status: searchParams.status }),
                      page: String(page)
                    }).toString()}`}
                    className={`px-4 py-2 border rounded transition-colors ${page === currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {page}
                  </Link>
                )
              } else if (page === currentPage - 3 || page === currentPage + 3) {
                return <span key={page} className="px-2">...</span>
              }
              return null
            })}

            {currentPage < totalPages && (
              <Link
                href={`/admin/novels?${new URLSearchParams({
                  ...(query && { q: query }),
                  ...(searchParams.category && { category: searchParams.category }),
                  ...(searchParams.status && { status: searchParams.status }),
                  page: String(currentPage + 1)
                }).toString()}`}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}