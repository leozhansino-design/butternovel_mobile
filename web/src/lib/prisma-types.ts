// src/lib/prisma-types.ts
// Local type definitions for Prisma enums
// These mirror the enums defined in prisma/schema.prisma
// Used when @prisma/client exports are unavailable

export type ContentRating = 'ALL_AGES' | 'TEEN_13' | 'MATURE_16' | 'EXPLICIT_18'
export type RightsType = 'ALL_RIGHTS_RESERVED' | 'CREATIVE_COMMONS'
export type ContributionType = 'RATING' | 'COMMENT' | 'RATING_REPLY' | 'DAILY_READ' | 'CHAPTER_READ' | 'OTHER'

export type NotificationType =
  | 'RATING_REPLY'
  | 'RATING_LIKE'
  | 'COMMENT_REPLY'
  | 'COMMENT_LIKE'
  | 'AUTHOR_NEW_NOVEL'
  | 'AUTHOR_NEW_CHAPTER'
  | 'NOVEL_UPDATE'
  | 'NOVEL_RATING'
  | 'NOVEL_COMMENT'
  | 'NEW_FOLLOWER'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'LEVEL_UP'

export type NotificationPriority = 'HIGH' | 'NORMAL' | 'LOW'

// Re-export for convenience
export const ContentRatingValues = {
  ALL_AGES: 'ALL_AGES' as ContentRating,
  TEEN_13: 'TEEN_13' as ContentRating,
  MATURE_16: 'MATURE_16' as ContentRating,
  EXPLICIT_18: 'EXPLICIT_18' as ContentRating,
} as const

export const RightsTypeValues = {
  ALL_RIGHTS_RESERVED: 'ALL_RIGHTS_RESERVED' as RightsType,
  CREATIVE_COMMONS: 'CREATIVE_COMMONS' as RightsType,
} as const
