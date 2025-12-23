'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MigrateWordCountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMigrate = async () => {
    if (!confirm('确定要重新计算所有章节的字符数吗？这个操作可能需要几分钟时间。')) {
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/admin/migrate-wordcount', {
        method: 'POST',
        credentials: 'include' // ✅ 确保 cookie 总是被发送
      })

      const data = await res.json()

      if (res.ok) {
        setResult(data.summary)
      } else {
        setError(data.error || 'Migration failed')
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin')}
          className="text-blue-600 hover:text-blue-800"
        >
          ← 返回管理后台
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">字符数迁移工具</h1>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-yellow-800 mb-2">⚠️ 注意事项</h2>
          <ul className="list-disc list-inside text-yellow-700 space-y-1">
            <li>此工具会重新计算所有章节的字符数</li>
            <li>旧数据使用"单词计数"（按空格分割），新数据使用"字符数"</li>
            <li>迁移过程可能需要几分钟，请耐心等待</li>
            <li>迁移完成后，章节列表的字符数将显示正确的值</li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="font-semibold mb-2">迁移说明：</h2>
          <p className="text-gray-700 mb-4">
            之前的章节使用"单词计数"（按空格分割），导致中文章节显示的字数不正确。
            例如：9000个中文字符会显示为600-700个"单词"。
          </p>
          <p className="text-gray-700">
            此迁移工具会：
          </p>
          <ol className="list-decimal list-inside text-gray-700 space-y-1 mt-2">
            <li>重新计算所有章节的实际字符数</li>
            <li>更新每个章节的 wordCount 字段</li>
            <li>重新计算每个小说的总字符数</li>
          </ol>
        </div>

        <button
          onClick={handleMigrate}
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? '迁移中...' : '开始迁移'}
        </button>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">❌ 迁移失败</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-4">✅ 迁移成功！</h3>
            <div className="space-y-2 text-gray-700">
              <p>📊 <strong>总章节数：</strong>{result.totalChapters}</p>
              <p>✓ <strong>已更新：</strong>{result.updated} 个章节</p>
              <p>⊘ <strong>已跳过：</strong>{result.skipped} 个章节（字符数已正确）</p>
              <p>📚 <strong>小说更新：</strong>{result.novelsUpdated} 个</p>
              {result.errors > 0 && (
                <p className="text-red-600">✗ <strong>错误：</strong>{result.errors} 个</p>
              )}
            </div>

            {result.errorDetails && result.errorDetails.length > 0 && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                <h4 className="font-semibold text-red-800 mb-2">错误详情：</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {result.errorDetails.map((err: any, idx: number) => (
                    <li key={idx}>
                      Chapter/Novel {err.chapterId}: {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
