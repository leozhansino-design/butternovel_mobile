/**
 * Client-side image compression utility
 * Compresses images before upload to stay within Vercel's 4.5MB request limit
 */

interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number  // 0.0 to 1.0
  maxSizeKB?: number  // Target max file size in KB
}

const DEFAULT_OPTIONS: CompressOptions = {
  maxWidth: 800,
  maxHeight: 1200,
  quality: 0.85,
  maxSizeKB: 500,  // 500KB max
}

/**
 * Compress an image file and return base64 string
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        try {
          const result = compressImageElement(img, opts)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Compress an image element
 */
function compressImageElement(
  img: HTMLImageElement,
  opts: CompressOptions
): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Calculate new dimensions while maintaining aspect ratio
  let { width, height } = img
  const maxWidth = opts.maxWidth || DEFAULT_OPTIONS.maxWidth!
  const maxHeight = opts.maxHeight || DEFAULT_OPTIONS.maxHeight!

  if (width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height
    height = maxHeight
  }

  canvas.width = width
  canvas.height = height

  // Draw image with white background (for PNG transparency)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  // Start with initial quality
  let quality = opts.quality || DEFAULT_OPTIONS.quality!
  let result = canvas.toDataURL('image/jpeg', quality)

  // If maxSizeKB is specified, iteratively reduce quality until size is under limit
  const maxSizeKB = opts.maxSizeKB || DEFAULT_OPTIONS.maxSizeKB!
  const maxSizeBytes = maxSizeKB * 1024

  // Estimate base64 size (base64 is ~33% larger than binary)
  let attempts = 0
  while (getBase64SizeBytes(result) > maxSizeBytes && quality > 0.1 && attempts < 10) {
    quality -= 0.1
    result = canvas.toDataURL('image/jpeg', quality)
    attempts++
  }

  return result
}

/**
 * Get approximate size of base64 string in bytes
 */
function getBase64SizeBytes(base64: string): number {
  // Remove data URL prefix
  const base64Data = base64.split(',')[1] || base64

  // Base64 encodes 3 bytes as 4 characters
  // Padding '=' represents missing bytes
  const padding = (base64Data.match(/=/g) || []).length
  return (base64Data.length * 3) / 4 - padding
}

/**
 * Check if file needs compression
 */
export function needsCompression(file: File, maxSizeKB: number = 500): boolean {
  return file.size > maxSizeKB * 1024
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/**
 * Compress image for novel cover (300x400 aspect ratio, max ~200KB)
 * More aggressive compression to stay well under Vercel's 4.5MB limit
 */
export async function compressCoverImage(file: File): Promise<string> {
  return compressImage(file, {
    maxWidth: 400,   // Smaller dimensions for better compression
    maxHeight: 533,  // ~4:3 aspect ratio
    quality: 0.75,   // Lower quality for smaller size
    maxSizeKB: 200,  // 200KB max - safe for Vercel limit
  })
}

/**
 * Compress image for avatar (1:1 aspect ratio, max 200KB)
 */
export async function compressAvatarImage(file: File): Promise<string> {
  return compressImage(file, {
    maxWidth: 400,   // 2x for retina
    maxHeight: 400,
    quality: 0.85,
    maxSizeKB: 150,  // 150KB max for avatars
  })
}
