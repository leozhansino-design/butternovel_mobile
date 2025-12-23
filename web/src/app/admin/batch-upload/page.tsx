'use client'

// app/admin/batch-upload/page.tsx
// 批量上传小说页面

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  parseContentFile,
  validateCoverImage,
  validateContentFile,
  validateParsedNovel,
  parseIndividualFiles,
  identifyCoverFile,
  isPromptFile,
  extractChapterInfoFromFilename,
  BATCH_UPLOAD_LIMITS,
  type NovelUploadData,
  type IndividualFilesUploadData,
  type ParsedNovel
} from '@/lib/batch-upload-utils'

interface UploadStatus {
  status: 'pending' | 'validating' | 'uploading' | 'completed' | 'failed' | 'cancelled'
  progress: number
  error?: string
  novelId?: number
}

type UploadDataUnion = NovelUploadData | IndividualFilesUploadData

export default function BatchUploadPage() {
  const [novels, setNovels] = useState<UploadDataUnion[]>([])
  const [uploadStatuses, setUploadStatuses] = useState<Map<string, UploadStatus>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const cancelledRef = useRef(false)

  // 选择文件夹
  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // 按文件夹组织文件
    const folders = new Map<string, {
      // 旧格式
      cover?: File
      content?: File
      // 新格式（独立文件）
      titleFile?: File
      blurbFile?: File
      categoryFile?: File
      tagsFile?: File
      ageFile?: File
      fullOutlineFile?: File // _full_outline.txt for fallback metadata
      chapterFiles: File[]
      allFiles: File[]
    }>()

    files.forEach(file => {
      const pathParts = file.webkitRelativePath.split('/')
      if (pathParts.length < 2) return // 跳过不在文件夹中的文件

      const folderName = pathParts[pathParts.length - 2]
      const fileName = pathParts[pathParts.length - 1]

      if (!folders.has(folderName)) {
        folders.set(folderName, { chapterFiles: [], allFiles: [] })
      }

      const folder = folders.get(folderName)!
      folder.allFiles.push(file)

      // 识别文件类型
      if (fileName === 'cover.jpg' || fileName === 'cover.png' || fileName === 'cover_300x400.jpg') {
        if (!folder.cover) { // 只保留第一个找到的封面
          folder.cover = file
        }
      } else if (fileName === 'content.txt') {
        folder.content = file
      } else if (fileName === 'title.txt') {
        folder.titleFile = file
      } else if (fileName === 'blurb.txt') {
        folder.blurbFile = file
      } else if (fileName === 'category.txt') {
        folder.categoryFile = file
      } else if (fileName === 'tags.txt') {
        folder.tagsFile = file
      } else if (fileName === 'age.txt') {
        folder.ageFile = file
      } else if (fileName === '_full_outline.txt') {
        folder.fullOutlineFile = file
      } else if (fileName.match(/^chapter_\d+_.*\.txt$/i)) {
        // 章节文件，但排除 prompt 文件
        if (!isPromptFile(fileName)) {
          folder.chapterFiles.push(file)
        } else {
          console.log(`🔇 [批量上传] 忽略提示词文件: ${fileName}`)
        }
      }
    })

    // 转换为 UploadData
    const novelData: UploadDataUnion[] = []
    for (const [folderName, folderFiles] of folders.entries()) {
      // 判断是哪种格式
      const hasContentTxt = !!folderFiles.content
      const hasIndividualFiles = !!folderFiles.titleFile || !!folderFiles.blurbFile || !!folderFiles.categoryFile

      if (hasIndividualFiles) {
        // 新格式：独立文件
        console.log(`📁 [批量上传] 识别为独立文件格式: ${folderName}`)

        // 识别封面（按优先级）
        const coverFile = identifyCoverFile(folderFiles.allFiles)

        novelData.push({
          folderName,
          coverFile,
          titleFile: folderFiles.titleFile,
          blurbFile: folderFiles.blurbFile,
          categoryFile: folderFiles.categoryFile,
          tagsFile: folderFiles.tagsFile,
          ageFile: folderFiles.ageFile,
          fullOutlineFile: folderFiles.fullOutlineFile,
          chapterFiles: folderFiles.chapterFiles
        } as IndividualFilesUploadData)
      } else if (hasContentTxt && folderFiles.cover) {
        // 旧格式：content.txt
        console.log(`📄 [批量上传] 识别为 content.txt 格式: ${folderName}`)
        novelData.push({
          folderName,
          coverFile: folderFiles.cover,
          contentFile: folderFiles.content
        } as NovelUploadData)
      } else {
        console.warn(`⚠️ [批量上传] 文件夹格式不完整，跳过: ${folderName}`)
      }
    }

    // 检查是否超过限制
    const totalNovels = novels.length + novelData.length
    if (totalNovels > BATCH_UPLOAD_LIMITS.MAX_NOVELS) {
      alert(`最多只能上传 ${BATCH_UPLOAD_LIMITS.MAX_NOVELS} 本小说。当前已有 ${novels.length} 本，新增 ${novelData.length} 本将超过限制。`)
      return
    }

    console.log(`📚 [批量上传] 共识别 ${novelData.length} 个小说文件夹`)

    // 验证所有文件
    const validatedNovels = await validateNovels(novelData)

    // 追加到现有列表
    setNovels(prev => [...prev, ...validatedNovels])

    // 重置文件输入，允许再次选择相同的文件夹
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 验证所有小说
  const validateNovels = async (novelData: UploadDataUnion[]) => {
    console.log('🚀 [批量上传] 开始验证', novelData.length, '本小说')

    const validatedNovels = await Promise.all(
      novelData.map(async (novel) => {
        console.log('📚 [批量上传] ========== 验证小说:', novel.folderName, '==========')
        try {
          // 判断是哪种格式
          const isIndividualFiles = 'chapterFiles' in novel

          if (isIndividualFiles) {
            // 新格式：独立文件
            console.log('📁 [批量上传] 使用独立文件格式验证')

            const errors: string[] = []
            const warnings: string[] = []

            // 验证必需文件存在（支持 _full_outline.txt 回退）
            const hasFullOutline = !!novel.fullOutlineFile
            if (!novel.titleFile && !hasFullOutline) {
              errors.push('缺少 title.txt 文件（或 _full_outline.txt）')
            }
            if (!novel.blurbFile && !hasFullOutline) {
              errors.push('缺少 blurb.txt 文件（或 _full_outline.txt）')
            }
            if (!novel.categoryFile && !hasFullOutline) {
              errors.push('缺少 category.txt 文件（或 _full_outline.txt）')
            }
            if (!novel.coverFile) {
              errors.push('缺少封面图片 (cover_300x400.jpg / cover.png / cover.jpg)')
            }
            if (novel.chapterFiles.length === 0) {
              errors.push('至少需要1个章节文件 (chapter_1_XXX.txt)')
            }
            if (hasFullOutline) {
              warnings.push('将使用 _full_outline.txt 作为元数据备用来源')
            }

            // 验证封面
            let coverValidation = { valid: true, errors: [] as string[], warnings: [] as string[] }
            if (novel.coverFile) {
              try {
                coverValidation = await validateCoverImage(novel.coverFile)
              } catch (error: any) {
                coverValidation = {
                  valid: false,
                  errors: [`封面验证失败: ${error.message}`],
                  warnings: []
                }
              }
            }

            // 解析文件内容
            let parsed: (ParsedNovel & { contentRating?: 'ALL_AGES' | 'TEEN_13' | 'MATURE_16' | 'EXPLICIT_18' }) | undefined
            let parseValidation: { valid: boolean; errors: string[]; warnings: string[] } = {
              valid: true,
              errors: [],
              warnings: []
            }

            if (errors.length === 0 && coverValidation.valid) {
              try {
                parsed = await parseIndividualFiles(novel)
                parseValidation = validateParsedNovel(parsed)
              } catch (error: any) {
                parseValidation = {
                  valid: false,
                  errors: [`解析失败: ${error.message}`],
                  warnings: []
                }
              }
            }

            return {
              ...novel,
              parsed,
              validation: {
                valid: errors.length === 0 && coverValidation.valid && parseValidation.valid,
                errors: [
                  ...errors,
                  ...coverValidation.errors,
                  ...parseValidation.errors
                ],
                warnings: [
                  ...warnings,
                  ...coverValidation.warnings,
                  ...parseValidation.warnings
                ]
              }
            }
          } else {
            // 旧格式：content.txt
            console.log('📄 [批量上传] 使用 content.txt 格式验证')

            const errors: string[] = []
            const warnings: string[] = []

            // 验证封面
            let coverValidation = { valid: true, errors: [] as string[], warnings: [] as string[] }
            try {
              coverValidation = await validateCoverImage(novel.coverFile)
            } catch (error: any) {
              coverValidation = {
                valid: false,
                errors: [`封面验证失败: ${error.message}`],
                warnings: []
              }
            }

            // 验证content.txt
            const contentValidation = validateContentFile(novel.contentFile)

            // 解析content.txt
            let parsed: ParsedNovel | undefined
            let parseValidation: { valid: boolean; errors: string[]; warnings: string[] } = {
              valid: true,
              errors: [],
              warnings: []
            }

            if (coverValidation.valid && contentValidation.valid) {
              try {
                parsed = await parseContentFile(novel.contentFile)
                parseValidation = validateParsedNovel(parsed)
              } catch (error: any) {
                parseValidation = {
                  valid: false,
                  errors: [`解析 content.txt 失败: ${error.message}`],
                  warnings: []
                }
              }
            }

            return {
              ...novel,
              parsed,
              validation: {
                valid: coverValidation.valid && contentValidation.valid && parseValidation.valid,
                errors: [
                  ...coverValidation.errors,
                  ...contentValidation.errors,
                  ...parseValidation.errors
                ],
                warnings: [
                  ...coverValidation.warnings,
                  ...contentValidation.warnings,
                  ...parseValidation.warnings
                ]
              }
            }
          }
        } catch (error: any) {
          console.error('❌ [批量上传] 验证过程出错:', error)
          return {
            ...novel,
            validation: {
              valid: false,
              errors: [`验证过程出错: ${error.message || '未知错误'}`],
              warnings: []
            }
          }
        }
      })
    )

    return validatedNovels
  }

  // 开始上传
  const handleStartUpload = async () => {
    const validNovels = novels.filter(n => n.validation?.valid)
    if (validNovels.length === 0) {
      alert('No valid novels to upload (please check validation errors)')
      return
    }

    setIsUploading(true)
    setIsPaused(false)
    cancelledRef.current = false

    // 初始化上传状态
    const statuses = new Map<string, UploadStatus>()
    validNovels.forEach(novel => {
      statuses.set(novel.folderName, {
        status: 'pending',
        progress: 0
      })
    })
    setUploadStatuses(statuses)

    // 依次上传
    for (let i = 0; i < validNovels.length; i++) {
      if (cancelledRef.current) break

      // 等待如果暂停
      while (isPaused && !cancelledRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (cancelledRef.current) break

      const novel = validNovels[i]
      await uploadNovel(novel, statuses)
    }

    setIsUploading(false)
  }

  // 上传单本小说
  const uploadNovel = async (novel: UploadDataUnion, statuses: Map<string, UploadStatus>) => {
    const updateStatus = (update: Partial<UploadStatus>) => {
      const current = statuses.get(novel.folderName)!
      statuses.set(novel.folderName, { ...current, ...update })
      setUploadStatuses(new Map(statuses))
    }

    try {
      updateStatus({ status: 'uploading', progress: 0 })

      if (!novel.coverFile) {
        throw new Error('缺少封面文件')
      }

      if (!novel.parsed) {
        throw new Error('解析数据缺失')
      }

      const formData = new FormData()
      formData.append('coverImage', novel.coverFile)
      formData.append('title', novel.parsed.title)
      formData.append('genre', novel.parsed.genre)
      formData.append('blurb', novel.parsed.blurb)
      formData.append('tags', JSON.stringify(novel.parsed.tags))
      formData.append('chapters', JSON.stringify(novel.parsed.chapters))

      // 如果有年龄分级信息，也一起传递
      if ('contentRating' in novel.parsed && novel.parsed.contentRating) {
        formData.append('contentRating', novel.parsed.contentRating)
      }

      updateStatus({ progress: 30 })

      const response = await fetch('/api/admin/batch-upload', {
        method: 'POST',
        body: formData
      })

      updateStatus({ progress: 80 })

      if (!response.ok) {
        // 尝试解析 JSON 错误，如果失败则使用文本内容
        let errorMessage = `上传失败: HTTP ${response.status}`
        try {
          const contentType = response.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            const error = await response.json()
            errorMessage = error.error || errorMessage
          } else {
            const text = await response.text()
            // 常见错误处理
            if (text.includes('Request Entity Too Large') || response.status === 413) {
              errorMessage = '文件太大，请减少章节数量或压缩封面图片'
            } else if (text.includes('timeout') || response.status === 504) {
              errorMessage = '上传超时，请稍后重试'
            } else {
              errorMessage = text.substring(0, 100) || errorMessage
            }
          }
        } catch {
          // JSON 解析失败，使用默认错误消息
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()

      updateStatus({
        status: 'completed',
        progress: 100,
        novelId: result.novel.id
      })

      console.log(`✅ [批量上传] 上传成功: ${novel.parsed.title} (ID: ${result.novel.id})`)
    } catch (error: any) {
      console.error(`❌ [批量上传] 上传失败: ${novel.folderName}`, error)
      updateStatus({
        status: 'failed',
        error: error.message || '上传失败'
      })
    }
  }

  // 暂停/继续
  const handleTogglePause = () => {
    setIsPaused(!isPaused)
  }

  // 取消上传
  const handleCancel = () => {
    if (confirm('确定要取消上传吗？已上传的小说不会被删除。')) {
      cancelledRef.current = true
      setIsUploading(false)
      setIsPaused(false)
    }
  }

  // 清空列表
  const handleClear = () => {
    if (isUploading) {
      alert('Upload in progress, cannot clear list')
      return
    }
    setNovels([])
    setUploadStatuses(new Map())
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 移除单个小说
  const handleRemoveNovel = (folderName: string) => {
    if (isUploading) {
      alert('无法在上传过程中移除小说')
      return
    }
    setNovels(prev => prev.filter(n => n.folderName !== folderName))
    // 同时移除上传状态
    setUploadStatuses(prev => {
      const newStatuses = new Map(prev)
      newStatuses.delete(folderName)
      return newStatuses
    })
  }

  const validCount = novels.filter(n => n.validation?.valid).length
  const completedCount = Array.from(uploadStatuses.values()).filter(s => s.status === 'completed').length
  const failedCount = Array.from(uploadStatuses.values()).filter(s => s.status === 'failed').length

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 批量上传小说</h1>
        <p className="text-gray-600">
          一次最多上传 {BATCH_UPLOAD_LIMITS.MAX_NOVELS} 本小说。每本小说需包含封面(cover.jpg, 300x400)和内容(content.txt)。
        </p>
      </div>

      {/* 上传区域 */}
      {novels.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-12 text-center hover:border-indigo-500 transition-colors">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">选择小说文件夹</h3>
          <p className="text-sm text-gray-600 mb-6">
            请选择包含多个小说文件夹的目录，每个文件夹应包含 cover.jpg 和 content.txt
          </p>
          <input
            ref={fileInputRef}
            type="file"
            /* @ts-ignore */
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleFolderSelect}
            className="hidden"
            id="folder-input"
          />
          <label
            htmlFor="folder-input"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            选择文件夹
          </label>
        </div>
      )}

      {/* 小说列表 */}
      {novels.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* 统计头部 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  已选择 {novels.length} 本小说
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  有效: {validCount} | 已上传: {completedCount} | 失败: {failedCount}
                </p>
              </div>
              <div className="flex gap-3">
                {!isUploading && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      /* @ts-ignore */
                      webkitdirectory=""
                      directory=""
                      multiple
                      onChange={handleFolderSelect}
                      className="hidden"
                      id="folder-input-add"
                    />
                    <label
                      htmlFor="folder-input-add"
                      className="inline-flex items-center px-4 py-2 text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 cursor-pointer transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      添加文件夹
                    </label>
                    <button
                      onClick={handleClear}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      清空列表
                    </button>
                    <button
                      onClick={handleStartUpload}
                      disabled={validCount === 0}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      开始上传
                    </button>
                  </>
                )}
                {isUploading && (
                  <>
                    <button
                      onClick={handleTogglePause}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      {isPaused ? '继续' : '暂停'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      取消
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 小说列表 */}
          <div className="divide-y divide-gray-200">
            {novels.map((novel, index) => {
              const status = uploadStatuses.get(novel.folderName)
              const isValid = novel.validation?.valid
              const errors = novel.validation?.errors || []
              const warnings = novel.validation?.warnings || []

              return (
                <div key={novel.folderName} className="p-6">
                  <div className="flex items-start gap-4">
                    {/* 状态图标 */}
                    <div className="flex-shrink-0">
                      {!status && isValid && (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {!status && !isValid && (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                      {status?.status === 'pending' && (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                      {status?.status === 'uploading' && (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                      {status?.status === 'completed' && (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {status?.status === 'failed' && (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* 小说信息 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {novel.parsed?.title || novel.folderName}
                          </h3>
                          {novel.parsed && (
                            <p className="text-sm text-gray-600 mt-1">
                              {novel.parsed.genre} | {novel.parsed.chapters.length} 章节 | {novel.parsed.tags.join(', ')}
                            </p>
                          )}
                        </div>
                        {/* 移除按钮 - 只在未上传和未上传失败时显示 */}
                        {!isUploading && !status?.status && (
                          <button
                            onClick={() => handleRemoveNovel(novel.folderName)}
                            className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="移除"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* 错误信息 */}
                      {errors.length > 0 && (
                        <div className="mt-2 p-3 bg-red-50 rounded-lg">
                          {errors.map((error, i) => (
                            <p key={i} className="text-sm text-red-700">• {error}</p>
                          ))}
                        </div>
                      )}

                      {/* 警告信息 */}
                      {warnings.length > 0 && (
                        <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                          {warnings.map((warning, i) => (
                            <p key={i} className="text-sm text-yellow-700">• {warning}</p>
                          ))}
                        </div>
                      )}

                      {/* 上传进度 */}
                      {status?.status === 'uploading' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>上传中...</span>
                            <span>{status.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${status.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* 上传失败 */}
                      {status?.status === 'failed' && (
                        <div className="mt-2 p-3 bg-red-50 rounded-lg">
                          <p className="text-sm text-red-700">上传失败: {status.error}</p>
                        </div>
                      )}

                      {/* 上传成功 */}
                      {status?.status === 'completed' && status.novelId && (
                        <div className="mt-2">
                          <a
                            href={`/admin/novels/${status.novelId}/edit`}
                            className="text-sm text-indigo-600 hover:text-indigo-700"
                          >
                            查看小说 →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 格式说明 */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 文件格式要求</h3>
        <div className="space-y-6 text-sm text-gray-700">
          <div>
            <p className="font-semibold mb-2 text-indigo-700">格式 1: 独立文件结构（推荐）</p>
            <p className="text-gray-600 mb-2">每个小说文件夹包含独立的元数据文件和章节文件：</p>
            <pre className="bg-white p-3 rounded border border-gray-200 overflow-x-auto">
{`novels/
├── novel1/
│   ├── cover_300x400.jpg  (优先) 或 cover.png / cover.jpg
│   ├── title.txt          (小说标题)
│   ├── blurb.txt          (小说简介)
│   ├── category.txt       (小说类型，如 Romance)
│   ├── tags.txt           (标签，逗号分隔，可选)
│   ├── age.txt            (年龄分级，可选)
│   ├── _full_outline.txt  (备用元数据，当上述文件为空时使用)
│   ├── chapter_1_Baton_Pass.txt
│   ├── chapter_2_Just_Keep_Swimming.txt
│   └── ...
└── novel2/
    ├── cover_300x400.jpg
    ├── title.txt
    └── ...`}
            </pre>
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-600">
                <span className="font-semibold">章节文件命名：</span> chapter_数字_标题.txt （下划线会转为空格）
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-semibold">忽略文件：</span> chapter_X_prompt.txt 会被自动忽略
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-semibold">年龄分级：</span> All Ages / Teen 13+ / Mature 16+ / Explicit 18+
              </p>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-4">
            <p className="font-semibold mb-2 text-gray-700">格式 2: content.txt 结构（兼容旧版）</p>
            <p className="text-gray-600 mb-2">使用单个 content.txt 文件包含所有内容：</p>
            <pre className="bg-white p-3 rounded border border-gray-200 overflow-x-auto">
{`novels/
├── novel1/
│   ├── cover.jpg    (必须是300x400像素)
│   └── content.txt
└── ...

content.txt 格式：
Tags: romance, fantasy, adventure
Title: 小说标题
Genre: Romance
Blurb: 小说简介（10-1000字符）

Chapter 1: 第一章标题
第一章正文内容...

Chapter 2: 第二章标题
第二章正文内容...`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
