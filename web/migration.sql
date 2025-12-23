-- Add likeCount to Rating table
ALTER TABLE "Rating" ADD COLUMN IF NOT EXISTS "likeCount" INTEGER NOT NULL DEFAULT 0;

-- Create RatingLike table
CREATE TABLE IF NOT EXISTS "RatingLike" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "guestId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "ratingId" TEXT NOT NULL,

    CONSTRAINT "RatingLike_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "RatingLike_ratingId_idx" ON "RatingLike"("ratingId");
CREATE INDEX IF NOT EXISTS "Rating_novelId_likeCount_createdAt_idx" ON "Rating"("novelId", "likeCount", "createdAt");

-- Add foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'RatingLike_userId_fkey'
    ) THEN
        ALTER TABLE "RatingLike" ADD CONSTRAINT "RatingLike_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'RatingLike_ratingId_fkey'
    ) THEN
        ALTER TABLE "RatingLike" ADD CONSTRAINT "RatingLike_ratingId_fkey" 
        FOREIGN KEY ("ratingId") REFERENCES "Rating"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add unique constraints
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'RatingLike_userId_ratingId_key'
    ) THEN
        ALTER TABLE "RatingLike" ADD CONSTRAINT "RatingLike_userId_ratingId_key" 
        UNIQUE ("userId", "ratingId");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'RatingLike_guestId_ratingId_key'
    ) THEN
        ALTER TABLE "RatingLike" ADD CONSTRAINT "RatingLike_guestId_ratingId_key" 
        UNIQUE ("guestId", "ratingId");
    END IF;
END $$;
