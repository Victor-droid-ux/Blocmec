-- Migration: Add privacy controls for IP/UA redaction
-- Tracks when IP addresses and user agents should be redacted based on retention policy

ALTER TABLE "Verification" 
ADD COLUMN "ip_recorded_at" TIMESTAMP DEFAULT now(),
ADD COLUMN "user_agent_redacted" BOOLEAN DEFAULT false,
ADD COLUMN "ip_redacted_at" TIMESTAMP;

-- Add index for finding records that need redaction
CREATE INDEX idx_verifications_ip_redaction 
ON "Verification"(ip_recorded_at, ip_redacted_at) 
WHERE ip_redacted_at IS NULL AND ip_address IS NOT NULL;

-- Add user settings for retention policy
ALTER TABLE "User"
ADD COLUMN "ip_retention_days" INTEGER DEFAULT 30,
ADD COLUMN "user_agent_retention_days" INTEGER DEFAULT 30;

-- Create audit log entry for privacy actions
CREATE INDEX idx_audit_logs_privacy_actions
ON "AuditLog"(action) 
WHERE action IN ('redact_verification_ip', 'redact_verification_ua', 'export_user_data', 'delete_user_scans');
