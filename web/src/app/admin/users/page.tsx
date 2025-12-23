'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UserStats {
  total: number
  newUsers: {
    today: number
    week: number
    month: number
  }
  byAuthMethod: {
    google: number
    facebook: number
    email: number
  }
  byStatus: {
    active: number
    banned: number
    verified: number
  }
  writers: number
}

interface User {
  id: string
  email: string
  name: string
  avatar: string | null
  role: string
  authMethod: 'google' | 'facebook' | 'email'
  isWriter: boolean
  isVerified: boolean
  isActive: boolean
  isBanned: boolean
  createdAt: string
  updatedAt: string
  stats: {
    comments: number
    ratings: number
    likes: number
    libraryBooks: number
    readingHistory: number
    replies: number
  }
}

interface UserDetail extends User {
  bio: string | null
  googleId: string | null
  facebookId: string | null
  writerName: string | null
  writerBio: string | null
  stats: User['stats'] & {
    ratingLikes: number
    forumPosts: number
    forumReplies: number
  }
  recentActivity: {
    comments: Array<{
      id: string
      content: string
      createdAt: string
      novel: { id: number; title: string; slug: string }
    }>
    ratings: Array<{
      id: string
      score: number
      review: string | null
      likeCount: number
      createdAt: string
      novel: { id: number; title: string; slug: string }
    }>
    library: Array<{
      addedAt: string
      novel: { id: number; title: string; slug: string; coverImage: string }
    }>
    readingHistory: Array<{
      lastReadAt: string
      novel: { id: number; title: string; slug: string }
      chapter: { id: number; title: string; chapterNumber: number }
    }>
  }
}

export default function UsersManagementPage() {
  const router = useRouter()

  // 状态管理
  const [stats, setStats] = useState<UserStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // 筛选和分页
  const [page, setPage] = useState(1)
  const [limit] = useState(10) // 每页显示10条
  const maxPages = 10 // 最多显示10页
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [authMethod, setAuthMethod] = useState('all')
  const [status, setStatus] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // 加载统计数据
  useEffect(() => {
    fetchStats()
  }, [])

  // 加载用户列表
  useEffect(() => {
    fetchUsers()
  }, [page, search, authMethod, status, sortBy, sortOrder])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/users/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        authMethod: authMethod === 'all' ? '' : authMethod,
        status: status === 'all' ? '' : status,
        sortBy,
        sortOrder,
      })

      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()

      if (data.success) {
        setUsers(data.users)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserDetail = async (userId: string) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      const data = await res.json()

      if (data.success) {
        setSelectedUser(data.user)
      }
    } catch (error) {
      console.error('Failed to fetch user detail:', error)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  // 限制最多显示10页（100条记录）
  const totalPages = Math.min(Math.ceil(total / limit), maxPages)
  const displayTotal = Math.min(total, maxPages * limit)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin')}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← 返回管理后台
        </button>
        <h1 className="text-3xl font-bold">用户管理</h1>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-1">总用户数</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total.toLocaleString()}</p>
            <div className="mt-2 text-xs text-gray-500">
              <span className="mr-3">今日 +{stats.newUsers.today}</span>
              <span className="mr-3">本周 +{stats.newUsers.week}</span>
              <span>本月 +{stats.newUsers.month}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-1">注册方式</h3>
            <div className="space-y-1 text-sm mt-2">
              <div className="flex justify-between">
                <span>Google:</span>
                <span className="font-semibold">{stats.byAuthMethod.google}</span>
              </div>
              <div className="flex justify-between">
                <span>Facebook:</span>
                <span className="font-semibold">{stats.byAuthMethod.facebook}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="font-semibold">{stats.byAuthMethod.email}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-1">用户状态</h3>
            <div className="space-y-1 text-sm mt-2">
              <div className="flex justify-between">
                <span>活跃:</span>
                <span className="font-semibold text-green-600">{stats.byStatus.active}</span>
              </div>
              <div className="flex justify-between">
                <span>已验证:</span>
                <span className="font-semibold">{stats.byStatus.verified}</span>
              </div>
              <div className="flex justify-between">
                <span>已封禁:</span>
                <span className="font-semibold text-red-600">{stats.byStatus.banned}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-1">用户活跃率</h3>
            <p className="text-3xl font-bold text-purple-600">
              {((stats.byStatus.active / stats.total) * 100).toFixed(1)}%
            </p>
            <div className="mt-2 text-xs text-gray-500">
              <div>{stats.byStatus.active.toLocaleString()} 活跃用户</div>
              <div className="text-gray-400">（有评论/评分/阅读记录）</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                搜索
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Email or name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                注册方式
              </label>
              <select
                value={authMethod}
                onChange={(e) => {
                  setAuthMethod(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部</option>
                <option value="google">Google</option>
                <option value="facebook">Facebook</option>
                <option value="email">邮箱</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                状态
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部</option>
                <option value="active">活跃</option>
                <option value="banned">已封禁</option>
                <option value="verified">已验证</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                排序
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-')
                  setSortBy(newSortBy)
                  setSortOrder(newSortOrder as 'asc' | 'desc')
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt-desc">注册时间 (新到旧)</option>
                <option value="createdAt-asc">注册时间 (旧到新)</option>
                <option value="email-asc">邮箱 (A-Z)</option>
                <option value="email-desc">邮箱 (Z-A)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            搜索
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">没有找到用户</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      用户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      注册方式
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      活动统计
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      注册时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-10 w-10 rounded-full"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                              {user.isWriter && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                                  作家
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            user.authMethod === 'google'
                              ? 'bg-red-100 text-red-800'
                              : user.authMethod === 'facebook'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.authMethod === 'google'
                            ? 'Google'
                            : user.authMethod === 'facebook'
                            ? 'Facebook'
                            : 'Email'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {user.isBanned && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                              已封禁
                            </span>
                          )}
                          {user.isVerified && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                              已验证
                            </span>
                          )}
                          {!user.isActive && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded">
                              未激活
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <div>评论: {user.stats.comments}</div>
                          <div>评分: {user.stats.ratings}</div>
                          <div>点赞: {user.stats.likes}</div>
                          <div>书架: {user.stats.libraryBooks}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => fetchUserDetail(user.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  显示 {(page - 1) * limit + 1} - {Math.min(page * limit, displayTotal)} / 共{' '}
                  {displayTotal} 条 {total > displayTotal && `(最多显示${maxPages}页)`}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    上一页
                  </button>
                  <span className="px-3 py-1">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-gray-200">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">用户详情</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {loadingDetail ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">加载中...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">基本信息</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">ID</label>
                      <p className="font-mono text-sm">{selectedUser.id}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Email</label>
                      <p>{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Name</label>
                      <p>{selectedUser.name || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Role</label>
                      <p>{selectedUser.role}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Registered</label>
                      <p>{new Date(selectedUser.createdAt).toLocaleString('en-US')}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Last Updated</label>
                      <p>{new Date(selectedUser.updatedAt).toLocaleString('en-US')}</p>
                    </div>
                  </div>

                  {selectedUser.bio && (
                    <div className="mt-4">
                      <label className="text-sm text-gray-600">Bio</label>
                      <p className="text-gray-700">{selectedUser.bio}</p>
                    </div>
                  )}
                </div>

                {/* Writer Info */}
                {selectedUser.isWriter && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Writer Information</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm text-gray-600">Writer Pen Name</label>
                        <p>{selectedUser.writerName || 'Not set'}</p>
                      </div>
                      {selectedUser.writerBio && (
                        <div>
                          <label className="text-sm text-gray-600">Writer Bio</label>
                          <p className="text-gray-700">{selectedUser.writerBio}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">用户参与度分析</h3>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">账号年龄</p>
                      <p className="text-xl font-bold text-blue-700">
                        {Math.floor((new Date().getTime() - new Date(selectedUser.createdAt).getTime()) / (1000 * 60 * 60 * 24))} 天
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">参与度评分</p>
                      <p className="text-xl font-bold text-purple-700">
                        {(selectedUser.stats.comments * 3 +
                          selectedUser.stats.ratings * 5 +
                          selectedUser.stats.replies * 2 +
                          selectedUser.stats.likes * 1) || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">综合活动指数</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">阅读活跃度</p>
                      <p className="text-xl font-bold text-green-700">
                        {selectedUser.stats.readingHistory}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">阅读过的书</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">社区贡献</p>
                      <p className="text-xl font-bold text-orange-700">
                        {selectedUser.stats.comments + selectedUser.stats.ratings + selectedUser.stats.replies}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">评论+评分+回复</p>
                    </div>
                  </div>

                  {/* Detailed Stats */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">详细统计</h4>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">💬 评论数</span>
                        <span className="font-semibold">{selectedUser.stats.comments}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">⭐ 评分数</span>
                        <span className="font-semibold">{selectedUser.stats.ratings}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">👍 点赞数</span>
                        <span className="font-semibold">{selectedUser.stats.likes}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">📚 书架藏书</span>
                        <span className="font-semibold">{selectedUser.stats.libraryBooks}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">📖 阅读记录</span>
                        <span className="font-semibold">{selectedUser.stats.readingHistory}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">💭 回复数</span>
                        <span className="font-semibold">{selectedUser.stats.replies}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">最近活动</h3>

                  {/* Recent Ratings */}
                  {selectedUser.recentActivity.ratings.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">最近评分</h4>
                      <div className="space-y-2">
                        {selectedUser.recentActivity.ratings.map((rating) => (
                          <div key={rating.id} className="bg-gray-50 rounded p-3">
                            <div className="flex justify-between items-start mb-1">
                              <a
                                href={`/novels/${rating.novel.slug}`}
                                className="text-blue-600 hover:underline font-medium"
                                target="_blank"
                              >
                                {rating.novel.title}
                              </a>
                              <span className="text-sm text-gray-500">
                                {new Date(rating.createdAt).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold">评分: {rating.score}/10</span>
                              {rating.likeCount > 0 && (
                                <span className="ml-3 text-gray-600">
                                  👍 {rating.likeCount}
                                </span>
                              )}
                            </div>
                            {rating.review && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {rating.review}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Comments */}
                  {selectedUser.recentActivity.comments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">最近评论</h4>
                      <div className="space-y-2">
                        {selectedUser.recentActivity.comments.map((comment) => (
                          <div key={comment.id} className="bg-gray-50 rounded p-3">
                            <div className="flex justify-between items-start mb-1">
                              <a
                                href={`/novels/${comment.novel.slug}`}
                                className="text-blue-600 hover:underline font-medium"
                                target="_blank"
                              >
                                {comment.novel.title}
                              </a>
                              <span className="text-sm text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {comment.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reading History */}
                  {selectedUser.recentActivity.readingHistory.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">最近阅读</h4>
                      <div className="space-y-2">
                        {selectedUser.recentActivity.readingHistory.map((history, idx) => (
                          <div key={idx} className="bg-gray-50 rounded p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <a
                                  href={`/novels/${history.novel.slug}`}
                                  className="text-blue-600 hover:underline font-medium"
                                  target="_blank"
                                >
                                  {history.novel.title}
                                </a>
                                <p className="text-sm text-gray-600">
                                  第 {history.chapter.chapterNumber} 章 -{' '}
                                  {history.chapter.title}
                                </p>
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(history.lastReadAt).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
