'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  SHORT_NOVEL_GENRES,
  getShortNovelGenreName,
  formatReadingTime,
  estimateReadingTime,
} from '@/lib/short-novel'

interface ShortNovelData {
  id: string
  folderName: string
  title: string
  shortNovelGenre: string
  age: string
  blurb: string
  content: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  novelId?: number
}

// Genre mapping from Chinese/English to slug
const GENRE_MAPPING: Record<string, string> = {
  // English
  'sweet romance': 'sweet-romance',
  'billionaire romance': 'billionaire-romance',
  'face slapping': 'face-slapping',
  'face-slapping': 'face-slapping',
  'rebirth': 'rebirth',
  'revenge': 'revenge',
  'regret': 'regret',
  'substitute': 'substitute',
  'true fake identity': 'true-fake-identity',
  'age gap': 'age-gap',
  'entertainment circle': 'entertainment-circle',
  'group pet': 'group-pet',
  'healing': 'healing-redemption',
  'redemption': 'healing-redemption',
  'lgbtq': 'lgbtq',
  'lgbtq+': 'lgbtq',
  'quick transmigration': 'quick-transmigration',
  'survival': 'survival-apocalypse',
  'apocalypse': 'survival-apocalypse',
  'system': 'system',
  // Chinese
  '甜宠': 'sweet-romance',
  '霸总': 'billionaire-romance',
  '打脸': 'face-slapping',
  '重生': 'rebirth',
  '复仇': 'revenge',
  '追悔': 'regret',
  '替身': 'substitute',
  '真假千金': 'true-fake-identity',
  '年龄差': 'age-gap',
  '娱乐圈': 'entertainment-circle',
  '团宠': 'group-pet',
  '治愈': 'healing-redemption',
  '救赎': 'healing-redemption',
  '快穿': 'quick-transmigration',
  '末日': 'survival-apocalypse',
  '系统': 'system',
}

function parseGenre(genreText: string): string {
  const normalized = genreText.toLowerCase().trim()

  // Direct match
  if (GENRE_MAPPING[normalized]) {
    return GENRE_MAPPING[normalized]
  }

  // Try to find partial match
  for (const [key, value] of Object.entries(GENRE_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value
    }
  }

  // Check if it's already a valid slug
  const validSlugs = SHORT_NOVEL_GENRES.map(g => g.id) as string[]
  if (validSlugs.includes(normalized)) {
    return normalized
  }

  // Default
  return 'sweet-romance'
}

// Parse full_response.txt to extract fields
function parseFullResponse(content: string): { title: string; genre: string; age: string; story: string } {
  const result = { title: '', genre: '', age: '', story: '' }

  // Try to find title
  const titleMatch = content.match(/(?:title|标题)[：:]\s*(.+)/i)
  if (titleMatch) {
    result.title = titleMatch[1].trim()
  }

  // Try to find genre
  const genreMatch = content.match(/(?:genre|类型|分类)[：:]\s*(.+)/i)
  if (genreMatch) {
    result.genre = genreMatch[1].trim()
  }

  // Try to find age
  const ageMatch = content.match(/(?:age|年龄|适龄)[：:]\s*(.+)/i)
  if (ageMatch) {
    result.age = ageMatch[1].trim()
  }

  // Story is usually the main content after headers
  // Try to find content after a separator or just use most of the text
  const storyMatch = content.match(/(?:story|内容|正文)[：:]\s*([\s\S]+)/i)
  if (storyMatch) {
    result.story = storyMatch[1].trim()
  } else {
    // Use everything after the first 500 chars as potential story
    result.story = content.length > 500 ? content.substring(500).trim() : content
  }

  return result
}

export default function BatchUploadShortsPage() {
  const [novels, setNovels] = useState<ShortNovelData[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState('')
  const folderInputRef = useRef<HTMLInputElement>(null)

  // Parse folder structure
  const handleFolderImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsScanning(true)
    setScanProgress('Scanning folders...')

    // Group files by folder
    const folderMap = new Map<string, Map<string, File>>()

    for (const file of Array.from(files)) {
      // Get folder path (remove filename)
      const pathParts = file.webkitRelativePath.split('/')
      if (pathParts.length < 2) continue

      // Get immediate parent folder name
      const folderPath = pathParts.slice(0, -1).join('/')
      const fileName = pathParts[pathParts.length - 1].toLowerCase()

      if (!folderMap.has(folderPath)) {
        folderMap.set(folderPath, new Map())
      }
      folderMap.get(folderPath)!.set(fileName, file)
    }

    setScanProgress(`Found ${folderMap.size} folders, processing...`)

    const newNovels: ShortNovelData[] = []
    let processed = 0

    for (const [folderPath, filesMap] of folderMap) {
      processed++
      if (processed % 50 === 0) {
        setScanProgress(`Processing ${processed}/${folderMap.size} folders...`)
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      try {
        // Read individual files
        let title = ''
        let genre = ''
        let age = ''
        let story = ''

        // Try to read title.txt
        const titleFile = filesMap.get('title.txt')
        if (titleFile) {
          title = (await titleFile.text()).trim()
        }

        // Try to read genre.txt
        const genreFile = filesMap.get('genre.txt')
        if (genreFile) {
          genre = (await genreFile.text()).trim()
        }

        // Try to read age.txt
        const ageFile = filesMap.get('age.txt')
        if (ageFile) {
          age = (await ageFile.text()).trim()
        }

        // Try to read story.txt
        const storyFile = filesMap.get('story.txt')
        if (storyFile) {
          story = (await storyFile.text()).trim()
        }

        // If any field is empty, try full_response.txt
        if (!title || !genre || !story) {
          const fullResponseFile = filesMap.get('full_response.txt')
          if (fullResponseFile) {
            const fullContent = await fullResponseFile.text()
            const parsed = parseFullResponse(fullContent)

            if (!title) title = parsed.title
            if (!genre) genre = parsed.genre
            if (!age) age = parsed.age
            if (!story) story = parsed.story
          }
        }

        // If still no story, try to find any large .txt file
        if (!story) {
          for (const [fileName, file] of filesMap) {
            if (fileName.endsWith('.txt') && !['title.txt', 'genre.txt', 'age.txt', 'full_response.txt'].includes(fileName)) {
              const content = await file.text()
              if (content.length > story.length) {
                story = content.trim()
                // If no title, use filename
                if (!title) {
                  title = fileName.replace('.txt', '').trim()
                }
              }
            }
          }
        }

        // Use folder name as title if still empty
        if (!title) {
          const folderName = folderPath.split('/').pop() || ''
          title = folderName
        }

        // Skip if no content
        if (!story || story.length < 100) {
          console.log(`Skipping ${folderPath}: no valid story content`)
          continue
        }

        // Create blurb from first 300 chars of story
        const blurb = story.substring(0, 300).trim() + (story.length > 300 ? '...' : '')

        newNovels.push({
          id: `novel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          folderName: folderPath.split('/').pop() || folderPath,
          title,
          shortNovelGenre: parseGenre(genre),
          age,
          blurb,
          content: story,
          status: 'pending',
        })
      } catch (error) {
        console.error(`Failed to parse folder ${folderPath}:`, error)
      }
    }

    setScanProgress(`Done! Found ${newNovels.length} valid novels`)
    setNovels(prev => [...prev, ...newNovels])
    setIsScanning(false)

    if (folderInputRef.current) {
      folderInputRef.current.value = ''
    }
  }

  // Update novel field
  const updateNovel = (id: string, field: keyof ShortNovelData, value: string) => {
    setNovels(novels.map(n =>
      n.id === id ? { ...n, [field]: value } : n
    ))
  }

  // Remove novel
  const removeNovel = (id: string) => {
    setNovels(novels.filter(n => n.id !== id))
  }

  // Clear all pending
  const clearPending = () => {
    if (confirm('Clear all pending novels?')) {
      setNovels(novels.filter(n => n.status !== 'pending'))
    }
  }

  // Upload all novels with concurrency control
  const handleUploadAll = async () => {
    const pendingNovels = novels.filter(n => n.status === 'pending')
    if (pendingNovels.length === 0) {
      alert('No novels to upload')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    let successCount = 0
    let errorCount = 0
    const concurrency = 5 // Upload 5 at a time

    for (let i = 0; i < pendingNovels.length; i += concurrency) {
      const batch = pendingNovels.slice(i, i + concurrency)

      // Mark batch as uploading
      setNovels(prev => prev.map(n =>
        batch.find(b => b.id === n.id) ? { ...n, status: 'uploading' as const } : n
      ))

      // Upload batch concurrently
      const results = await Promise.allSettled(
        batch.map(async (novel) => {
          const response = await fetch('/api/admin/batch-upload-shorts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: novel.title,
              shortNovelGenre: novel.shortNovelGenre,
              blurb: novel.blurb,
              content: novel.content,
            }),
          })
          const data = await response.json()
          return { novel, response, data }
        })
      )

      // Process results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { novel, response, data } = result.value
          if (response.ok) {
            setNovels(prev => prev.map(n =>
              n.id === novel.id ? { ...n, status: 'success' as const, novelId: data.novel?.id } : n
            ))
            successCount++
          } else {
            setNovels(prev => prev.map(n =>
              n.id === novel.id ? { ...n, status: 'error' as const, error: data.error || 'Upload failed' } : n
            ))
            errorCount++
          }
        } else {
          // Find which novel failed
          const failedNovel = batch[results.indexOf(result)]
          if (failedNovel) {
            setNovels(prev => prev.map(n =>
              n.id === failedNovel.id ? { ...n, status: 'error' as const, error: 'Network error' } : n
            ))
            errorCount++
          }
        }
      }

      setUploadProgress(Math.round(((i + batch.length) / pendingNovels.length) * 100))
    }

    setIsUploading(false)
    alert(`Upload complete!\nSuccess: ${successCount}\nFailed: ${errorCount}`)
  }

  const pendingCount = novels.filter(n => n.status === 'pending').length
  const successCount = novels.filter(n => n.status === 'success').length
  const errorCount = novels.filter(n => n.status === 'error').length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batch Upload Short Novels</h1>
          <p className="text-gray-600 mt-1">Upload up to 1000+ short novels from folder structure</p>
        </div>
        <Link
          href="/admin/batch-upload"
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          Switch to Regular Novels
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{novels.length}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
          <div className="text-sm text-yellow-600">Pending</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="text-2xl font-bold text-green-700">{successCount}</div>
          <div className="text-sm text-green-600">Uploaded</div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="text-2xl font-bold text-red-700">{errorCount}</div>
          <div className="text-sm text-red-600">Failed</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mb-8">
        <label className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium cursor-pointer">
          📁 Select Folder
          <input
            ref={folderInputRef}
            type="file"
            /* @ts-expect-error webkitdirectory is non-standard */
            webkitdirectory=""
            multiple
            onChange={handleFolderImport}
            className="hidden"
            disabled={isScanning}
          />
        </label>

        {pendingCount > 0 && (
          <>
            <button
              onClick={clearPending}
              disabled={isUploading}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50"
            >
              Clear Pending
            </button>
            <button
              onClick={handleUploadAll}
              disabled={isUploading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 ml-auto"
            >
              {isUploading ? `Uploading... ${uploadProgress}%` : `Upload All (${pendingCount})`}
            </button>
          </>
        )}
      </div>

      {/* Scanning Progress */}
      {isScanning && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-blue-700">{scanProgress}</span>
          </div>
        </div>
      )}

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Folder Structure Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h3 className="font-semibold text-blue-900 mb-2">📂 Expected Folder Structure</h3>
        <pre className="text-sm text-blue-800 font-mono bg-blue-100 p-3 rounded">
{`parent-folder/
├── novel-1/
│   ├── title.txt      (标题)
│   ├── genre.txt      (类型: sweet-romance, rebirth, etc.)
│   ├── age.txt        (年龄分级)
│   ├── story.txt      (故事内容)
│   └── full_response.txt (备用，如果上面为空则从这里提取)
├── novel-2/
│   └── ...
└── novel-1000/
    └── ...`}
        </pre>
        <p className="text-sm text-blue-600 mt-2">
          <strong>支持的类型：</strong> {SHORT_NOVEL_GENRES.map(g => g.id).join(', ')}
        </p>
        <p className="text-sm text-blue-600 mt-1">
          <strong>中文类型：</strong> 甜宠, 霸总, 打脸, 重生, 复仇, 追悔, 替身, 真假千金, 娱乐圈, 团宠, 治愈, 快穿, 末日, 系统
        </p>
      </div>

      {/* Novels List */}
      {novels.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No short novels added yet</h2>
          <p className="text-gray-500">Select a folder containing novel subfolders</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quick Stats Table for large batches */}
          {novels.length > 20 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Quick Overview (showing first 100)</h3>
              <p className="text-sm text-gray-500 mb-4">
                {novels.length} total novels loaded. Displaying first 100 for performance.
              </p>
            </div>
          )}

          {/* Novel Cards - limit display for performance */}
          {novels.slice(0, 100).map((novel, index) => {
            const readingTime = estimateReadingTime(novel.content.length)

            return (
              <div
                key={novel.id}
                className={`bg-white rounded-lg border p-4 ${
                  novel.status === 'success'
                    ? 'border-green-300 bg-green-50'
                    : novel.status === 'error'
                    ? 'border-red-300 bg-red-50'
                    : novel.status === 'uploading'
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        novel.status === 'success'
                          ? 'bg-green-200 text-green-800'
                          : novel.status === 'error'
                          ? 'bg-red-200 text-red-800'
                          : novel.status === 'uploading'
                          ? 'bg-amber-200 text-amber-800'
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {novel.status === 'success' && `✓ ID: ${novel.novelId}`}
                        {novel.status === 'error' && `✗ ${novel.error}`}
                        {novel.status === 'uploading' && '⏳ Uploading...'}
                        {novel.status === 'pending' && 'Pending'}
                      </span>
                    </div>

                    {novel.status === 'pending' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={novel.title}
                          onChange={(e) => updateNovel(novel.id, 'title', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-medium"
                          placeholder="Title"
                        />
                        <div className="flex gap-2">
                          <select
                            value={novel.shortNovelGenre}
                            onChange={(e) => updateNovel(novel.id, 'shortNovelGenre', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {SHORT_NOVEL_GENRES.map((genre) => (
                              <option key={genre.id} value={genre.id}>
                                {genre.name}
                              </option>
                            ))}
                          </select>
                          <span className="text-sm text-gray-500 py-1">
                            {novel.content.length.toLocaleString()} chars (~{formatReadingTime(readingTime)})
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-gray-900 truncate">{novel.title}</p>
                        <p className="text-sm text-gray-500">
                          {getShortNovelGenreName(novel.shortNovelGenre)} · {novel.content.length.toLocaleString()} chars
                        </p>
                      </div>
                    )}
                  </div>

                  {novel.status === 'pending' && (
                    <button
                      onClick={() => removeNovel(novel.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {novels.length > 100 && (
            <div className="text-center py-4 text-gray-500">
              ... and {novels.length - 100} more novels
            </div>
          )}
        </div>
      )}
    </div>
  )
}
