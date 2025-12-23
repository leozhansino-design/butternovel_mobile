-- ButterNovel 评分系统数据库迁移
-- 在 Vercel Postgres 控制台运行此 SQL

-- 1. 为 Novel 表添加评分字段
ALTER TABLE "Novel"
ADD COLUMN IF NOT EXISTS "averageRating" DECIMAL(3,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "totalRatings" INTEGER DEFAULT 0;

-- 2. 创建 Rating 表
CREATE TABLE IF NOT EXISTS "Rating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "score" INTEGER NOT NULL,
    "review" TEXT,
    "userId" TEXT NOT NULL,
    "novelId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 外键约束
    CONSTRAINT "Rating_userId_fkey"
        FOREIGN KEY ("userId")
        REFERENCES "User"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT "Rating_novelId_fkey"
        FOREIGN KEY ("novelId")
        REFERENCES "Novel"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 3. 创建唯一约束（每个用户只能对每本小说评分一次）
CREATE UNIQUE INDEX IF NOT EXISTS "Rating_userId_novelId_key"
ON "Rating"("userId", "novelId");

-- 4. 创建性能索引
CREATE INDEX IF NOT EXISTS "Rating_novelId_idx" ON "Rating"("novelId");
CREATE INDEX IF NOT EXISTS "Rating_createdAt_idx" ON "Rating"("createdAt");

-- 5. 验证
SELECT
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'Novel'
    AND column_name IN ('averageRating', 'totalRatings');

SELECT COUNT(*) as rating_table_exists
FROM information_schema.tables
WHERE table_name = 'Rating';
