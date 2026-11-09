-- Migration: Clear base64 QR images from database
-- Reason: QR images are now generated on-demand via /api/qr/image/[tokenId]
-- This prevents database bloat (tens of MB for 10k codes)

-- Clear all qr_image_url values that contain base64 data
UPDATE "QrCode" SET qr_image_url = NULL WHERE qr_image_url IS NOT NULL AND qr_image_url LIKE 'data:image/%';

-- Optional: Add comment to track the change
-- No-op comment for audit trail: Migration clears base64 QR images, enabling on-demand generation
