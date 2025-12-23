-- Migration: Add Short Novel Fields
-- This migration adds fields to support short novels (15,000-50,000 characters)

-- Add short novel fields to Novel table
ALTER TABLE "Novel" ADD COLUMN IF NOT EXISTS "isShortNovel" BOOLEAN DEFAULT false;
ALTER TABLE "Novel" ADD COLUMN IF NOT EXISTS "shortNovelGenre" TEXT;
ALTER TABLE "Novel" ADD COLUMN IF NOT EXISTS "readingPreview" TEXT;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "Novel_isShortNovel_isPublished_isBanned_idx" ON "Novel"("isShortNovel", "isPublished", "isBanned");
CREATE INDEX IF NOT EXISTS "Novel_isShortNovel_shortNovelGenre_idx" ON "Novel"("isShortNovel", "shortNovelGenre");
