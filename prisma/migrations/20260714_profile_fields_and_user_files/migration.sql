ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "phone" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "location" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "department" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "bio" TEXT,
  ADD COLUMN IF NOT EXISTS "avatar_url" VARCHAR(1024);

CREATE TABLE IF NOT EXISTS "UserFile" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "original_name" VARCHAR(512) NOT NULL,
  "stored_name" VARCHAR(512) NOT NULL,
  "mime_type" VARCHAR(255) NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "storage_path" VARCHAR(1024) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_user_files_user_id" ON "UserFile"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_files_created_at" ON "UserFile"("created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UserFile_user_id_fkey'
  ) THEN
    ALTER TABLE "UserFile"
      ADD CONSTRAINT "UserFile_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
