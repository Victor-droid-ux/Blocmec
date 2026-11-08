// lib/privacy.ts
import crypto from "crypto";

// Verification records only need to answer "how many distinct devices scanned
// this code", not "who was this person". Hashes keep that ability while making
// the stored value useless if the database is ever exposed.
const hashSecret =
  process.env.BLOCKMEC_PII_HASH_SECRET ??
  process.env.SESSION_SECRET ??
  process.env.ENCRYPTION_KEY ??
  "blockmec-verification";

export const USER_AGENT_MAX_LENGTH = 200;

export function hashClientIp(
  forwardedFor: string | null,
  realIp: string | null,
): string | null {
  // x-forwarded-for is a list: "client, proxy1, proxy2". Only the first hop is
  // the client, and only that value should be recorded.
  const candidate =
    forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "";
  if (!candidate) return null;

  return crypto.createHmac("sha256", hashSecret).update(candidate).digest("hex");
}

export function summarizeUserAgent(userAgent: string | null): string | null {
  if (!userAgent) return null;
  const trimmed = userAgent.trim();
  return trimmed ? trimmed.slice(0, USER_AGENT_MAX_LENGTH) : null;
}

export function getVerificationRetentionDays() {
  const parsed = Number.parseInt(
    process.env.BLOCKMEC_VERIFICATION_RETENTION_DAYS ?? "365",
    10,
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 365;
}
