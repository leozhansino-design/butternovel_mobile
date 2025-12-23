// src/lib/content-rating.ts
// 内容分级和版权许可辅助函数

import type { ContentRating, RightsType } from '@/lib/prisma-types'

// 内容分级选项（带描述）
export const CONTENT_RATING_OPTIONS = [
  {
    value: 'ALL_AGES' as ContentRating,
    label: 'All Ages',
    description: 'Suitable for all ages. No mature content, violence, or strong language.',
  },
  {
    value: 'TEEN_13' as ContentRating,
    label: 'Teen 13+',
    description: 'Suitable for ages 13 and up. May contain mild violence, language, or suggestive themes.',
  },
  {
    value: 'MATURE_16' as ContentRating,
    label: 'Mature 16+',
    description: 'Suitable for ages 16 and up. May contain moderate violence, strong language, or mature themes.',
  },
  {
    value: 'EXPLICIT_18' as ContentRating,
    label: 'Explicit 18+',
    description: 'Adults only (18+). Contains explicit violence, sexual content, or graphic language.',
  },
]

// 版权许可选项（带描述）
export const RIGHTS_TYPE_OPTIONS = [
  {
    value: 'ALL_RIGHTS_RESERVED' as RightsType,
    label: 'All Rights Reserved',
    description: 'You retain full copyright. Others cannot reproduce, distribute, or create derivative works without your permission.',
  },
  {
    value: 'CREATIVE_COMMONS' as RightsType,
    label: 'Creative Commons',
    description: 'You allow others to share and adapt your work with attribution. You still retain copyright but grant certain permissions.',
  },
]

// 获取内容分级显示文本
export function getContentRatingLabel(rating: ContentRating): string {
  const option = CONTENT_RATING_OPTIONS.find((opt) => opt.value === rating)
  return option?.label || 'All Ages'
}

// 获取版权类型显示文本
export function getRightsTypeLabel(rightsType: RightsType): string {
  const option = RIGHTS_TYPE_OPTIONS.find((opt) => opt.value === rightsType)
  return option?.label || 'All Rights Reserved'
}

// 获取内容分级样式类名
export function getContentRatingColor(rating: ContentRating): string {
  switch (rating) {
    case 'ALL_AGES':
      return 'text-green-700 bg-green-50 border-green-200'
    case 'TEEN_13':
      return 'text-blue-700 bg-blue-50 border-blue-200'
    case 'MATURE_16':
      return 'text-amber-700 bg-amber-50 border-amber-200'
    case 'EXPLICIT_18':
      return 'text-red-700 bg-red-50 border-red-200'
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200'
  }
}
