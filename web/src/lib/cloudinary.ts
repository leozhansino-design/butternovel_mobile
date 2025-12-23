// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * 上传小说封面到 Cloudinary
 * @param base64Image - Base64 格式的图片
 * @param novelTitle - 小说标题（用于日志）
 * @returns Cloudinary URL 和 public_id
 */
export async function uploadNovelCover(base64Image: string, novelTitle: string) {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'butternovel/covers',
      public_id: `cover-${Date.now()}`,
      transformation: [
        { 
          width: 300, 
          height: 400, 
          crop: 'fill',
          quality: 'auto:good',
          fetch_format: 'auto'  // 自动选择最优格式（WebP等）
        }
      ],
      overwrite: false,
      resource_type: 'image'
    })

    return {
      url: result.secure_url,
      publicId: result.public_id
    }
  } catch (error: any) {
    console.error('❌ [Cloudinary] Upload error:', error.message)
    throw new Error(`Failed to upload cover: ${error.message}`)
  }
}

/**
 * 上传用户头像到 Cloudinary
 * @param base64Image - Base64 格式的图片
 * @param userId - 用户 ID
 * @returns Cloudinary URL 和 public_id
 */
export async function uploadUserAvatar(base64Image: string, userId: string) {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'butternovel/avatars',
      public_id: `avatar-${userId}`,
      transformation: [
        { 
          width: 400, 
          height: 400, 
          crop: 'fill', 
          gravity: 'face',  // 智能人脸识别裁剪
          quality: 'auto:good',
          fetch_format: 'auto'
        }
      ],
      overwrite: true,  // 允许覆盖旧头像
      resource_type: 'image'
    })

    return {
      url: result.secure_url,
      publicId: result.public_id
    }
  } catch (error: any) {
    console.error('❌ [Cloudinary] Upload error:', error.message)
    throw new Error(`Failed to upload avatar: ${error.message}`)
  }
}

/**
 * 从 Cloudinary 删除图片
 * @param publicId - Cloudinary public_id
 */
export async function deleteImage(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return { success: true, result }
  } catch (error: any) {
    console.error(`❌ [Cloudinary] Delete error: ${publicId}`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 上传段落评论图片到 Cloudinary
 * @param base64Image - Base64 格式的图片
 * @param userId - 用户 ID
 * @returns Cloudinary URL 和 public_id
 */
export async function uploadCommentImage(base64Image: string, userId: string) {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'butternovel/comments',
      public_id: `comment-${userId}-${Date.now()}`,
      transformation: [
        {
          width: 800,  // 最大宽度800px
          crop: 'limit',  // 保持比例，不超过指定尺寸
          quality: 'auto:good',
          fetch_format: 'auto'
        }
      ],
      overwrite: false,
      resource_type: 'image'
    })

    return {
      url: result.secure_url,
      publicId: result.public_id
    }
  } catch (error: any) {
    console.error('❌ [Cloudinary] Upload error:', error.message)
    throw new Error(`Failed to upload comment image: ${error.message}`)
  }
}

/**
 * 获取优化后的图片 URL
 * @param publicId - Cloudinary public_id
 * @param options - 转换选项
 */
export function getOptimizedImageUrl(publicId: string, options?: {
  width?: number
  height?: number
  quality?: string
}) {
  return cloudinary.url(publicId, {
    width: options?.width || 300,
    height: options?.height || 400,
    crop: 'fill',
    quality: options?.quality || 'auto',
    fetch_format: 'auto'
  })
}

export default cloudinary