-- Add verification_domain field to User table
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "verification_domain" VARCHAR(255);

-- Add allowed_categories field to User table (TEXT array)
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "allowed_categories" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Match the existing optional, unique username field, allowing multiple NULLs.
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_index i
    JOIN pg_class idx ON idx.oid = i.indexrelid
    JOIN pg_namespace ns ON ns.oid = idx.relnamespace
    WHERE ns.nspname = current_schema()
      AND idx.relname = 'User_username_key'
      AND i.indrelid = '"User"'::regclass
      AND i.indisunique AND i.indisvalid AND i.indisready
      AND NOT i.indnullsnotdistinct
      AND i.indnkeyatts = 1 AND i.indnatts = 1
      AND i.indexprs IS NULL AND i.indpred IS NULL
      AND pg_get_indexdef(i.indexrelid, 1, true) = 'username'
  ) THEN
    RAISE EXCEPTION 'User_username_key must be a valid unique index on username allowing multiple NULLs';
  END IF;
END $$;

-- Create index for verification domain lookups
CREATE INDEX IF NOT EXISTS "idx_user_verification_domain" ON "User"("verification_domain");

-- Create index for category restrictions
CREATE INDEX IF NOT EXISTS "idx_user_allowed_categories" ON "User" USING GIN("allowed_categories");
