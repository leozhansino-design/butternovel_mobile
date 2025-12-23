-- 🔧 SECURITY FIX: Add password field to AdminProfile table
-- This migration adds password support to admin_profile for database-backed authentication
-- Migration: add_admin_password_field
-- Date: 2025-11-15

-- Add password column to admin_profile table
ALTER TABLE "AdminProfile" ADD COLUMN IF NOT EXISTS "password" TEXT;

-- Add index for faster authentication queries (optional, email already indexed)
-- The password field will store bcrypt hashes

COMMENT ON COLUMN "AdminProfile"."password" IS 'Bcrypt hashed password for admin authentication';
