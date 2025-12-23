'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Users, Eye } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type TimeRange = 'all' | '1day' | '3days' | '1week' | '1month' | '3months' | '6months' | '1year'

interface Stats {
  totalNovels: number
  totalUsers: number
  totalViews: number
}

interface ChartDataPoint {
  date: string
  novels: number
  users: number
  views: number
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState<TimeRange>('1day')
  const [stats, setStats] = useState<Stats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [rangeLabel, setRangeLabel] = useState('1 Day')

  // ✅ 将 fetchData 逻辑移到 useEffect 内部，避免依赖问题
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 获取统计数据
        const statsRes = await fetch(`/api/admin/stats?range=${range}`, {
          credentials: 'include' // ✅ 确保 cookie 总是被发送
        })
        const statsData = await statsRes.json()
        setStats(statsData.stats)
        setRangeLabel(statsData.label)

        // 获取图表数据
        const chartRes = await fetch('/api/admin/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // ✅ 确保 cookie 总是被发送
          body: JSON.stringify({ range })
        })
        const chartDataRes = await chartRes.json()
        setChartData(chartDataRes.data)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [range])

  const rangeOptions: { value: TimeRange; label: string }[] = [
    { value: '1day', label: '1 Day' },
    { value: '3days', label: '3 Days' },
    { value: '1week', label: '1 Week' },
    { value: '1month', label: '1 Month' },
    { value: '3months', label: '3 Months' },
    { value: '6months', label: '6 Months' },
    { value: '1year', label: '1 Year' },
    { value: 'all', label: 'All Time' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Platform overview and statistics</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 flex-wrap justify-end">
          {rangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                range === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 统计卡片 */}
      {loading ? (
        <div className="grid grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* Total Novels Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Novels</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {stats?.totalNovels.toLocaleString()}
                </p>
                <p className="text-gray-500 text-xs mt-3">{rangeLabel}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Users Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {stats?.totalUsers.toLocaleString()}
                </p>
                <p className="text-gray-500 text-xs mt-3">{rangeLabel}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Views Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Views</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {stats?.totalViews.toLocaleString()}
                </p>
                <p className="text-gray-500 text-xs mt-3">{rangeLabel}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Eye size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图表区域 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Novels Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Novels Growth</h3>
          {loading ? (
            <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="novels" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name="Novels"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Users Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Users Growth</h3>
          {loading ? (
            <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                />
                <Bar 
                  dataKey="users" 
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                  name="Users"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Views Chart - Full Width */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">👁️ Views Trend</h3>
        {loading ? (
          <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="#f97316" 
                strokeWidth={3}
                dot={{ fill: '#f97316', r: 5 }}
                name="Views"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}