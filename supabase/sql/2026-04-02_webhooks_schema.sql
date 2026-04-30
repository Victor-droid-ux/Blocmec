-- Apply this in Supabase SQL Editor.
-- Idempotent webhook schema for environments where Prisma Migrate is unavailable.

create extension if not exists pgcrypto;

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'WebhookStatus' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "WebhookStatus" AS ENUM ('active', 'paused', 'disabled');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'WebhookDeliveryStatus' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('queued', 'processing', 'delivered', 'failed');
  END IF;
END $$;

-- WebhookEndpoint
CREATE TABLE IF NOT EXISTS "WebhookEndpoint" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "api_key_id" uuid NULL,
  "name" varchar(255) NULL,
  "endpoint_url" text NOT NULL,
  "allowed_domains" text[] NOT NULL DEFAULT '{}',
  "events" text[] NOT NULL DEFAULT '{}',
  "signing_secret_hash" varchar(255) NOT NULL,
  "signing_secret_encrypted" text NOT NULL,
  "status" "WebhookStatus" NOT NULL DEFAULT 'active',
  "timeout_ms" integer NOT NULL DEFAULT 10000,
  "max_retries" integer NOT NULL DEFAULT 6,
  "last_delivery_at" timestamp(3) NULL,
  "last_delivery_status" varchar(50) NULL,
  "last_error" text NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- WebhookEventPayload
CREATE TABLE IF NOT EXISTS "WebhookEventPayload" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "batch_id" uuid NULL,
  "event_type" varchar(100) NOT NULL,
  "summary" jsonb NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" timestamp(3) NULL
);

-- WebhookDeliveryJob
CREATE TABLE IF NOT EXISTS "WebhookDeliveryJob" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "webhook_id" uuid NOT NULL,
  "payload_id" uuid NULL,
  "event_type" varchar(100) NOT NULL,
  "payload" jsonb NOT NULL,
  "delivery_id" varchar(255) NOT NULL,
  "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'queued',
  "attempts" integer NOT NULL DEFAULT 0,
  "next_attempt_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "delivered_at" timestamp(3) NULL,
  "dead_lettered_at" timestamp(3) NULL,
  "response_status" integer NULL,
  "last_error" text NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Constraints (added idempotently)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'WebhookEndpoint_user_id_fkey'
  ) THEN
    ALTER TABLE "WebhookEndpoint"
      ADD CONSTRAINT "WebhookEndpoint_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'WebhookEndpoint_api_key_id_fkey'
  ) THEN
    ALTER TABLE "WebhookEndpoint"
      ADD CONSTRAINT "WebhookEndpoint_api_key_id_fkey"
      FOREIGN KEY ("api_key_id") REFERENCES "ApiKey"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'WebhookEventPayload_user_id_fkey'
  ) THEN
    ALTER TABLE "WebhookEventPayload"
      ADD CONSTRAINT "WebhookEventPayload_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'WebhookEventPayload_batch_id_fkey'
  ) THEN
    ALTER TABLE "WebhookEventPayload"
      ADD CONSTRAINT "WebhookEventPayload_batch_id_fkey"
      FOREIGN KEY ("batch_id") REFERENCES "Batch"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'WebhookDeliveryJob_webhook_id_fkey'
  ) THEN
    ALTER TABLE "WebhookDeliveryJob"
      ADD CONSTRAINT "WebhookDeliveryJob_webhook_id_fkey"
      FOREIGN KEY ("webhook_id") REFERENCES "WebhookEndpoint"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'WebhookDeliveryJob_payload_id_fkey'
  ) THEN
    ALTER TABLE "WebhookDeliveryJob"
      ADD CONSTRAINT "WebhookDeliveryJob_payload_id_fkey"
      FOREIGN KEY ("payload_id") REFERENCES "WebhookEventPayload"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'WebhookDeliveryJob_delivery_id_key'
  ) THEN
    ALTER TABLE "WebhookDeliveryJob"
      ADD CONSTRAINT "WebhookDeliveryJob_delivery_id_key"
      UNIQUE ("delivery_id");
  END IF;
END $$;

ALTER TABLE "WebhookEndpoint"
  ADD COLUMN IF NOT EXISTS "allowed_domains" text[] NOT NULL DEFAULT '{}';

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_webhooks_user_id"
  ON "WebhookEndpoint" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_webhooks_api_key_id"
  ON "WebhookEndpoint" ("api_key_id");

CREATE INDEX IF NOT EXISTS "idx_webhooks_status"
  ON "WebhookEndpoint" ("status");

CREATE INDEX IF NOT EXISTS "idx_webhook_jobs_webhook_id"
  ON "WebhookDeliveryJob" ("webhook_id");

CREATE INDEX IF NOT EXISTS "idx_webhook_jobs_payload_id"
  ON "WebhookDeliveryJob" ("payload_id");

CREATE INDEX IF NOT EXISTS "idx_webhook_jobs_status_next_attempt"
  ON "WebhookDeliveryJob" ("status", "next_attempt_at");

CREATE INDEX IF NOT EXISTS "idx_webhook_payloads_user_created"
  ON "WebhookEventPayload" ("user_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_webhook_payloads_event"
  ON "WebhookEventPayload" ("event_type");
