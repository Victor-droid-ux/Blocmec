-- Add verification_domain field to User table
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "verification_domain" VARCHAR(255);

-- Add allowed_categories field to User table (TEXT array)
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "allowed_categories" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add unique constraint to username (allowing NULL)
ALTER TABLE "User"
  ADD CONSTRAINT "User_username_key" UNIQUE NULLS NOT DISTINCT ("username");

-- Create index for verification domain lookups
CREATE INDEX IF NOT EXISTS "idx_user_verification_domain" ON "User"("verification_domain");

-- Create index for category restrictions
CREATE INDEX IF NOT EXISTS "idx_user_allowed_categories" ON "User" USING GIN("allowed_categories");

