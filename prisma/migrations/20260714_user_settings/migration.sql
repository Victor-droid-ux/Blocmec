CREATE TABLE IF NOT EXISTS "UserSettings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "company_name" VARCHAR(255),
  "company_email" VARCHAR(255),
  "company_website" VARCHAR(1024),
  "company_address" TEXT,
  "timezone" VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
  "language" VARCHAR(20) NOT NULL DEFAULT 'en-US',
  "date_format" VARCHAR(20) NOT NULL DEFAULT 'MM/DD/YYYY',
  "email_notifications" BOOLEAN NOT NULL DEFAULT true,
  "sms_notifications" BOOLEAN NOT NULL DEFAULT false,
  "push_notifications" BOOLEAN NOT NULL DEFAULT true,
  "two_factor_auth" BOOLEAN NOT NULL DEFAULT false,
  "session_timeout_minutes" INTEGER NOT NULL DEFAULT 30,
  "api_access_enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserSettings_user_id_key" ON "UserSettings"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_settings_user_id" ON "UserSettings"("user_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UserSettings_user_id_fkey'
  ) THEN
    ALTER TABLE "UserSettings"
      ADD CONSTRAINT "UserSettings_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;