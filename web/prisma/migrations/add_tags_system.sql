-- Migration: Add Tags System
-- Description: Add Tag model and Novel-Tag many-to-many relationship
-- Date: 2025-11-17

-- 1. Create Tag table
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- 2. Create Novel-Tag junction table for many-to-many relationship
CREATE TABLE "_NovelTags" (
    "A" TEXT NOT NULL,  -- Tag.id
    "B" INTEGER NOT NULL  -- Novel.id
);

-- 3. Add new fields to Novel table
ALTER TABLE "Novel" ADD COLUMN "hotScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Novel" ADD COLUMN "bookmarkCount" INTEGER NOT NULL DEFAULT 0;

-- 4. Drop old tags array field from Novel table
ALTER TABLE "Novel" DROP COLUMN IF EXISTS "tags";

-- 5. Create unique constraints
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- 6. Create indexes for Tag table
CREATE INDEX "Tag_slug_idx" ON "Tag"("slug");
CREATE INDEX "Tag_count_idx" ON "Tag"("count");

-- 7. Create indexes for Novel-Tag junction table
CREATE UNIQUE INDEX "_NovelTags_AB_unique" ON "_NovelTags"("A", "B");
CREATE INDEX "_NovelTags_B_index" ON "_NovelTags"("B");

-- 8. Add foreign key constraints for junction table
ALTER TABLE "_NovelTags" ADD CONSTRAINT "_NovelTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_NovelTags" ADD CONSTRAINT "_NovelTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. Create indexes for Novel sorting
CREATE INDEX "Novel_hotScore_idx" ON "Novel"("hotScore");
CREATE INDEX "Novel_bookmarkCount_idx" ON "Novel"("bookmarkCount");
CREATE INDEX "Novel_viewCount_idx" ON "Novel"("viewCount");
