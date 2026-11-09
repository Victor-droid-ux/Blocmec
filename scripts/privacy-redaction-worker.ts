// scripts/privacy-redaction-worker.ts
// Automatically redact old IP addresses and user agents based on retention policies
// Run via: npm run privacy:redact or schedule with cron

import prisma from "@/lib/prisma";

const DEFAULT_IP_RETENTION_DAYS = 30;
const DEFAULT_UA_RETENTION_DAYS = 30;

async function redactOldIpAddresses() {
  try {
    const now = new Date();

    // Get all users (privacy redaction is optional, so we process all users)
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    let totalRedacted = 0;
    const DEFAULT_RETENTION_DAYS = 30;

    for (const user of users) {
      const cutoffDate = new Date(
        now.getTime() - DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000
      );

      // Find and redact old verifications
      const verifications = await prisma.verification.findMany({
        where: {
          qr_code: {
            user_id: user.id,
          },
          ip_address: { not: null },
          created_at: { lt: cutoffDate },
        },
        select: { id: true },
        take: 1000, // Process in batches
      });

      if (verifications.length > 0) {
        const redactedCount = await prisma.verification.updateMany({
          where: {
            id: { in: verifications.map((v) => v.id) },
          },
          data: {
            ip_address: "[REDACTED]",
          },
        });

        totalRedacted += redactedCount.count;

        // Log redaction event
        await prisma.auditLog.create({
          data: {
            user_id: user.id,
            action: "redact_verification_ip",
            resource_type: "Verification",
            resource_id: "batch",
            metadata: {
              count: redactedCount.count,
              retention_days: DEFAULT_RETENTION_DAYS,
              cutoff_date: cutoffDate.toISOString(),
            },
          },
        });
      }
    }

    console.log(`[Privacy Redaction] Redacted IP addresses from ${totalRedacted} verifications`);
    return totalRedacted;
  } catch (error) {
    console.error("[Privacy Redaction] IP redaction error:", error);
    throw error;
  }
}

async function redactOldUserAgents() {
  try {
    const now = new Date();

    const users = await prisma.user.findMany({
      select: { id: true },
    });

    let totalRedacted = 0;
    const DEFAULT_RETENTION_DAYS = 30;

    for (const user of users) {
      const cutoffDate = new Date(
        now.getTime() - DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000
      );

      const verifications = await prisma.verification.findMany({
        where: {
          qr_code: {
            user_id: user.id,
          },
          user_agent: { not: null },
          created_at: { lt: cutoffDate },
        },
        select: { id: true },
        take: 1000,
      });

      if (verifications.length > 0) {
        const redactedCount = await prisma.verification.updateMany({
          where: {
            id: { in: verifications.map((v) => v.id) },
          },
          data: {
            user_agent: "[REDACTED]",
          },
        });

        totalRedacted += redactedCount.count;

        await prisma.auditLog.create({
          data: {
            user_id: user.id,
            action: "redact_verification_ua",
            resource_type: "Verification",
            resource_id: "batch",
            metadata: {
              count: redactedCount.count,
              retention_days: DEFAULT_RETENTION_DAYS,
              cutoff_date: cutoffDate.toISOString(),
            },
          },
        });
      }
    }

    console.log(`[Privacy Redaction] Redacted user agents from ${totalRedacted} verifications`);
    return totalRedacted;
  } catch (error) {
    console.error("[Privacy Redaction] UA redaction error:", error);
    throw error;
  }
}

async function main() {
  console.log("[Privacy Redaction] Starting privacy redaction worker...");

  const ipRedacted = await redactOldIpAddresses();
  const uaRedacted = await redactOldUserAgents();

  console.log(`[Privacy Redaction] Completed: ${ipRedacted} IPs, ${uaRedacted} UAs redacted`);

  process.exit(0);
}

main().catch((error) => {
  console.error("[Privacy Redaction] Fatal error:", error);
  process.exit(1);
});
