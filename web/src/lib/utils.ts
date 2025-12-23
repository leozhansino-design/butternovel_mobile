export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Smart truncate that doesn't cut words in the middle
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function smartTruncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || ''

  let truncated = text.substring(0, maxLength)
  const lastSpaceIndex = truncated.lastIndexOf(' ')

  // If we found a space and it's not too far back (at least 70% of maxLength)
  if (lastSpaceIndex > maxLength * 0.7) {
    truncated = truncated.substring(0, lastSpaceIndex)
  }

  return truncated.trim() + '...'
}