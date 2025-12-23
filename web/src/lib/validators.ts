// src/lib/validators.ts
// 📋 统一的数据验证 Schemas

import { z } from 'zod'

// ============================================
// 小说 (Novel) Schemas
// ============================================

export const novelCreateSchema = z.object({
  title: z.string()
    .min(1, 'Title cannot be empty')
    .max(120, 'Title must be 120 characters or less'),

  coverImage: z.string()
    .min(1, 'Cover image cannot be empty'),

  categoryId: z.coerce.number()
    .int('Category ID must be an integer')
    .positive('Please select a valid genre/category'),

  blurb: z.string()
    .min(1, 'Description cannot be empty')
    .max(3000, 'Description must be 3000 characters or less'),

  status: z.enum(['ONGOING', 'COMPLETED'], {
    message: 'Status must be ONGOING or COMPLETED'
  }),

  contentRating: z.enum(['ALL_AGES', 'TEEN_13', 'MATURE_16', 'EXPLICIT_18'], {
    message: 'Invalid content rating'
  }).optional().default('ALL_AGES'),

  rightsType: z.enum(['ALL_RIGHTS_RESERVED', 'CREATIVE_COMMONS'], {
    message: 'Invalid rights type'
  }).optional().default('ALL_RIGHTS_RESERVED'),

  isPublished: z.boolean().optional(),
  isDraft: z.boolean().optional(),

  chapters: z.array(z.object({
    title: z.string().min(1, 'Chapter title cannot be empty').max(100, 'Chapter title too long'),
    content: z.string().min(1, 'Chapter content cannot be empty').max(30000, 'Chapter content too long')
  })).optional()
})

export const novelUpdateSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(120, 'Title too long').optional(),
  blurb: z.string().min(1, 'Blurb cannot be empty').max(3000, 'Blurb too long').optional(),
  categoryId: z.coerce.number().int().positive('Please select a valid genre/category').optional(),
  status: z.enum(['ONGOING', 'COMPLETED']).optional(),
  contentRating: z.enum(['ALL_AGES', 'TEEN_13', 'MATURE_16', 'EXPLICIT_18']).optional(),
  rightsType: z.enum(['ALL_RIGHTS_RESERVED', 'CREATIVE_COMMONS']).optional(),
  coverImage: z.string().optional(),
  isPublished: z.boolean().optional(),
  isDraft: z.boolean().optional(),
  shortNovelGenre: z.string().optional(),
})

// Tags update schema
export const tagsUpdateSchema = z.object({
  tags: z.array(
    z.string()
      .min(1, 'Tag cannot be empty')
      .max(30, 'Tag must be 30 characters or less')
      .regex(/^[a-z0-9-]+$/, 'Tag must contain only lowercase letters, numbers, and hyphens')
  )
  .max(20, 'Maximum 20 tags allowed')
  .default([])
})

// ============================================
// 章节 (Chapter) Schemas
// ============================================

export const chapterCreateSchema = z.object({
  novelId: z.coerce.number().int().positive(),
  title: z.string()
    .min(1, 'Title cannot be empty')
    .max(100, 'Title must be 100 characters or less'),
  content: z.string()
    .min(1, 'Content cannot be empty')
    .max(30000, 'Content must be 30000 characters or less'),
  chapterNumber: z.coerce.number().int().min(0), // Allow 0 for auto-calculation
  isPublished: z.boolean().optional(),
})

export const chapterUpdateSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(100, 'Title too long').optional(),
  content: z.string().min(1, 'Content cannot be empty').max(30000, 'Content too long').optional(),
  isPublished: z.boolean().optional(),
})

// ============================================
// 评分 (Rating) Schema
// ============================================

export const ratingSchema = z.object({
  score: z.coerce.number()
    .int('Rating must be an integer')
    .refine(
      (val) => [2, 4, 6, 8, 10].includes(val),
      { message: 'Rating must be one of: 2, 4, 6, 8, 10' }
    ),
  review: z.union([
    z.string().max(1000, 'Review must be 1000 characters or less'),
    z.null(),
    z.undefined()
  ])
  .transform(val => {
    // 将空字符串、null、undefined统一转为undefined
    if (!val || val.trim() === '') return undefined
    return val
  })
  .optional(),
})

// ============================================
// 认证 (Auth) Schemas
// ============================================

export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password must be 50 characters or less'),
  name: z.string()
    .min(1)
    .max(50)
    .optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password cannot be empty'),
})

// ============================================
// 用户资料 (Profile) Schemas
// ============================================

export const profileUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Name cannot be empty')
    .max(50, 'Name must be 50 characters or less')
    .optional(),
  bio: z.string()
    .max(500, 'Bio must be 500 characters or less')
    .optional(),
})

// ============================================
// 图片验证
// ============================================

export const IMAGE_LIMITS = {
  MAX_SIZE: 2 * 1024 * 1024, // 2MB
  COVER: { width: 300, height: 400 },
  AVATAR: { width: 256, height: 256 },
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
} as const

/**
 * 客户端图片验证 (浏览器环境)
 */
export function validateImage(
  file: File,
  type: 'cover' | 'avatar'
): Promise<{ valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    // 1. Type check
    if (!IMAGE_LIMITS.ALLOWED_TYPES.includes(file.type as any)) {
      resolve({
        valid: false,
        error: 'Unsupported file type. Please upload JPG, PNG, or WebP format'
      })
      return
    }

    // 2. Size check
    if (file.size > IMAGE_LIMITS.MAX_SIZE) {
      const maxMB = IMAGE_LIMITS.MAX_SIZE / 1024 / 1024
      resolve({
        valid: false,
        error: `File too large. Maximum allowed: ${maxMB}MB`
      })
      return
    }

    // 3. Dimension check
    const img = new window.Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const dimensions = type === 'cover' ? IMAGE_LIMITS.COVER : IMAGE_LIMITS.AVATAR

      if (img.width !== dimensions.width || img.height !== dimensions.height) {
        resolve({
          valid: false,
          error: `Image dimensions must be ${dimensions.width}x${dimensions.height}px (current: ${img.width}x${img.height}px)`
        })
      } else {
        resolve({ valid: true })
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ valid: false, error: 'Unable to load image' })
    }

    img.src = url
  })
}

/**
 * 服务端 Base64 图片验证
 */
export function validateBase64Image(base64: string): { valid: boolean; error?: string } {
  // 检查是否是有效的 base64 格式
  const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,/

  if (!base64Pattern.test(base64)) {
    return {
      valid: false,
      error: 'Invalid image format. Must be base64 encoded JPG, PNG, or WebP'
    }
  }

  // 检查大小 (粗略估算: base64 比原始大约大 33%)
  const estimatedSize = (base64.length * 3) / 4
  if (estimatedSize > IMAGE_LIMITS.MAX_SIZE * 1.5) {
    return {
      valid: false,
      error: 'Image too large'
    }
  }

  return { valid: true }
}

// ============================================
// 字数限制和计算
// ============================================

export const WORD_LIMITS = {
  TITLE_MAX: 120,
  BLURB_MAX: 3000,
  CHAPTER_TITLE_MAX: 100,
  CHAPTER_CHARS_MAX: 30000, // ✅ 改名：字符数限制（不是单词数）
  COMMENT_MAX: 500,
  REVIEW_MAX: 1000,
} as const

// ⚠️ 向后兼容：保留旧名称
export const CHAPTER_WORDS_MAX = WORD_LIMITS.CHAPTER_CHARS_MAX

/**
 * 计算文本字符数（不是英文单词数）
 * ✅ 适用于中文、英文等所有语言
 */
export function countWords(text: string): number {
  return text.trim().length
}

/**
 * 验证字数限制
 */
export function validateWordCount(
  text: string,
  maxWords: number
): { valid: boolean; count: number; error?: string } {
  const count = countWords(text)
  return {
    valid: count <= maxWords,
    count,
    error: count > maxWords
      ? `Exceeds character limit of ${maxWords} (current: ${count})`
      : undefined
  }
}

// ============================================
// 通用验证辅助函数
// ============================================

/**
 * 验证并返回解析后的数据
 *
 * 使用示例:
 * ```typescript
 * const result = validateWithSchema(novelCreateSchema, body)
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error }, { status: 400 })
 * }
 * const data = result.data
 * ```
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details?: any } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const firstError = result.error.issues[0]
  return {
    success: false,
    error: firstError?.message || 'Validation failed',
    details: result.error.flatten()
  }
}

/**
 * 安全验证 (不抛出错误)
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
) {
  return schema.safeParse(data)
}
