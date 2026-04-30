-- Apply this in Supabase SQL Editor.
-- Idempotent user profile/status schema alignment for environments without Prisma Migrate.

-- Ensure enum exists for user status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'UserStatus' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended');
  END IF;
END $$;

-- Add username column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'username'
  ) THEN
    ALTER TABLE "User"
      ADD COLUMN "username" varchar(255) NULL;
  END IF;
END $$;

-- Add status column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE "User"
      ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'active';
  END IF;
END $$;

-- Align status column definition even if it already existed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'status'
  ) THEN
    -- Backfill nulls safely before enforcing NOT NULL
    EXECUTE 'UPDATE "User" SET "status" = ''active'' WHERE "status" IS NULL';

    -- Ensure expected default and nullability
    ALTER TABLE "User"
      ALTER COLUMN "status" SET DEFAULT 'active';

    ALTER TABLE "User"
      ALTER COLUMN "status" SET NOT NULL;
  END IF;
END $$;
