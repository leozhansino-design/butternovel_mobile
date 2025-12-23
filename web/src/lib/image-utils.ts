// src/lib/image-utils.ts
// 图片优化工具函数

/**
 * 生成 Cloudinary 图片的模糊占位符 URL
 * 使用 Cloudinary 转换 API 生成 10px 宽的超小模糊版本
 */
export function getCloudinaryBlurUrl(imageUrl: string): string {
  if (!imageUrl.includes('cloudinary.com')) {
    // 如果不是 Cloudinary 图片，返回透明占位符
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  }

  // Cloudinary URL 格式: https://res.cloudinary.com/[cloud_name]/image/upload/[transformations]/[public_id]
  // 我们需要插入转换参数：w_10,q_10,e_blur:1000

  const parts = imageUrl.split('/upload/')
  if (parts.length !== 2) {
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  }

  // 生成超小模糊版本：10px 宽，低质量，强模糊
  const blurTransform = 'w_10,q_10,e_blur:1000'
  const blurUrl = `${parts[0]}/upload/${blurTransform}/${parts[1]}`

  return blurUrl
}

/**
 * 生成 base64 编码的模糊占位符（用于非 Cloudinary 图片）
 */
export function getDefaultBlurDataUrl(): string {
  // 10x10 灰色模糊占位符
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=='
}
