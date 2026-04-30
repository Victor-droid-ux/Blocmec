//lib/webhook.ts

import crypto from "crypto";
import prisma from "@/lib/prisma";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 6;

export const WEBHOOK_EVENTS = {
  QR_GENERATED: "qr.generated",
  QR_BATCH_COMPLETED: "qr.batch.completed",
  QR_CODES_GENERATED: "qr.codes.generated",
  QR_VERIFIED: "qr.verified",
  WEBHOOK_TEST: "webhook.test",
} as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];

function normalizeDomain(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const wildcardNormalized = withoutProtocol.startsWith("*.")
    ? withoutProtocol.slice(2)
    : withoutProtocol;
  const host = wildcardNormalized
    .split("/")[0]
    ?.split(":")[0]
    ?.replace(/\.$/, "");

  return host || null;
}

function endpointHostFromUrl(endpointUrl: string) {
  return new URL(endpointUrl).hostname.trim().toLowerCase().replace(/\.$/, "");
}

function isHostAllowed(host: string, allowedDomains: string[]) {
  if (allowedDomains.length === 0) return true;
  return allowedDomains.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}

function readString(summary: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = summary[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function readNumber(summary: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = summary[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function getWebhookEncryptionKey() {
  const configured =
    process.env.WEBHOOK_SECRET_ENCRYPTION_KEY ??
    process.env.WEBHOOK_SIGNING_ENCRYPTION_KEY;
  if (configured) {
    return crypto.createHash("sha256").update(configured).digest();
  }

  if (process.env.NODE_ENV !== "production") {
    return crypto
      .createHash("sha256")
      .update("blockmec-dev-webhook-encryption-key")
      .digest();
  }

  throw new Error(
    "Missing WEBHOOK_SECRET_ENCRYPTION_KEY (or WEBHOOK_SIGNING_ENCRYPTION_KEY) environment variable.",
  );
}

function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000);
}

function computeBackoffSeconds(attempts: number) {
  const base = 30;
  const max = 3600;
  const exponential = Math.min(base * 2 ** Math.max(0, attempts - 1), max);
  const jitter = Math.floor(Math.random() * 20);
  return Math.min(exponential + jitter, max);
}

export function nextRetryAt(attempts: number) {
  return addSeconds(new Date(), computeBackoffSeconds(attempts));
}

export function generateSigningSecret() {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`;
}

export function hashSigningSecret(secret: string) {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export function encryptSigningSecret(secret: string) {
  const key = getWebhookEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64url")}.${authTag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptSigningSecret(encrypted: string) {
  const [ivPart, authTagPart, ciphertextPart] = encrypted.split(".");
  if (!ivPart || !authTagPart || !ciphertextPart) {
    throw new Error("Invalid encrypted signing secret format.");
  }

  const key = getWebhookEncryptionKey();
  const iv = Buffer.from(ivPart, "base64url");
  const authTag = Buffer.from(authTagPart, "base64url");
  const ciphertext = Buffer.from(ciphertextPart, "base64url");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

export function createWebhookSecretMaterial() {
  const plain = generateSigningSecret();
  return {
    plain,
    hash: hashSigningSecret(plain),
    encrypted: encryptSigningSecret(plain),
  };
}

export function signWebhookPayload(
  payload: string,
  secret: string,
  timestamp: string,
) {
  const data = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("hex");
  return `v1=${signature}`;
}

async function createPayloadRecord(params: {
  userId: string;
  eventType: string;
  batchId?: string;
  summary: Record<string, unknown>;
  payload: Record<string, unknown>;
  expiresAt?: Date;
}) {
  const row = await prisma.webhookEventPayload.create({
    data: {
      user_id: params.userId,
      event_type: params.eventType,
      batch_id: params.batchId,
      summary: params.summary as any,
      payload: params.payload as any,
      expires_at: params.expiresAt,
    },
    select: {
      id: true,
      user_id: true,
      batch_id: true,
      created_at: true,
      event_type: true,
      summary: true,
    },
  });

  return row;
}

export async function enqueueWebhookDeliveryJobs(params: {
  userId: string;
  eventType: string;
  summary: Record<string, unknown>;
  payloadRecordId?: string;
}) {
  const { userId, eventType, summary, payloadRecordId } = params;

  const webhooks = await prisma.webhookEndpoint.findMany({
    where: {
      user_id: userId,
      status: "active",
      events: { has: eventType },
    },
    select: { id: true },
  });

  if (webhooks.length === 0) {
    return 0;
  }

  const now = new Date();
  const batchId = readString(summary, ["batch_id", "batchId"]);
  const qrCount = readNumber(summary, ["qr_count", "qrCount"]);

  const rows = webhooks.map((webhook) => {
    const deliveryId = crypto.randomUUID();

    return {
      webhook_id: webhook.id,
      payload_id: payloadRecordId,
      event_type: eventType,
      payload: {
        event: eventType,
        delivery_id: deliveryId,
        occurred_at: now.toISOString(),
        user_id: userId,
        batch_id: batchId,
        qr_count: qrCount,
        payload_ref: payloadRecordId
          ? `/api/user/webhooks/payloads/${payloadRecordId}`
          : null,
        summary: summary as any,
      },
      delivery_id: deliveryId,
      status: "queued" as const,
      attempts: 0,
      next_attempt_at: now,
    };
  });

  await prisma.webhookDeliveryJob.createMany({ data: rows });
  return rows.length;
}

export async function publishWebhookEvent(params: {
  userId: string;
  batchId?: string;
  eventType: WebhookEvent;
  summary: Record<string, unknown>;
  payload: Record<string, unknown>;
  payloadTtlDays?: number;
}) {
  const ttlDays = Math.max(1, params.payloadTtlDays ?? 7);
  const payloadRecord = await createPayloadRecord({
    userId: params.userId,
    batchId: params.batchId,
    eventType: params.eventType,
    summary: params.summary,
    payload: params.payload,
    expiresAt: addSeconds(new Date(), ttlDays * 24 * 60 * 60),
  });

  return enqueueWebhookDeliveryJobs({
    userId: params.userId,
    eventType: params.eventType,
    summary: params.summary,
    payloadRecordId: payloadRecord.id,
  });
}

export async function enqueueQrBatchWebhookJobs(params: {
  userId: string;
  batchId: string;
  productName: string;
  productType: string;
  quantity: number;
}) {
  const { userId, batchId, productName, productType, quantity } = params;

  const generatedAt = new Date().toISOString();

  const batchSummary = {
    batch_id: batchId,
    product_name: productName,
    product_type: productType,
    qr_count: quantity,
    occurred_at: generatedAt,
  };

  const summaryPayload = await createPayloadRecord({
    userId,
    batchId,
    eventType: "qr.batch.completed",
    summary: batchSummary,
    payload: {
      batch_id: batchId,
      include: ["summary"],
    },
    expiresAt: addSeconds(new Date(), 60 * 60 * 24 * 14),
  });

  const generatedPayload = await createPayloadRecord({
    userId,
    batchId,
    eventType: "qr.generated",
    summary: batchSummary,
    payload: {
      batch_id: batchId,
      include: ["qrcodes"],
    },
    expiresAt: addSeconds(new Date(), 60 * 60 * 24 * 14),
  });

  let jobsEnqueued = 0;

  jobsEnqueued += await enqueueWebhookDeliveryJobs({
    userId,
    eventType: "qr.batch.completed",
    summary: {
      ...batchSummary,
      delivery_hint: "Use payload_ref to fetch details.",
    },
    payloadRecordId: summaryPayload.id,
  });

  jobsEnqueued += await enqueueWebhookDeliveryJobs({
    userId,
    eventType: "qr.generated",
    summary: {
      ...batchSummary,
      delivery_hint: "Use payload_ref to fetch generated QR details.",
    },
    payloadRecordId: generatedPayload.id,
  });

  // Backward compatibility for existing subscriptions
  jobsEnqueued += await enqueueWebhookDeliveryJobs({
    userId,
    eventType: "qr.codes.generated",
    summary: {
      ...batchSummary,
      delivery_hint: "Use payload_ref to fetch generated QR details.",
    },
    payloadRecordId: generatedPayload.id,
  });

  return jobsEnqueued;
}

export async function deliverWebhookJob(jobId: string) {
  const job = await prisma.webhookDeliveryJob.findUnique({
    where: { id: jobId },
    include: { webhook: true },
  });

  if (!job || job.webhook.status !== "active") {
    return { delivered: false, skipped: true };
  }

  try {
    const endpointHost = endpointHostFromUrl(job.webhook.endpoint_url);
    const allowedDomains = job.webhook.allowed_domains
      .map((domain) => normalizeDomain(domain))
      .filter(Boolean) as string[];

    if (!isHostAllowed(endpointHost, allowedDomains)) {
      const policyError =
        "Webhook endpoint host does not match configured webhook allowed domains.";

      await prisma.webhookDeliveryJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          last_error: policyError,
          response_status: null,
          next_attempt_at: addSeconds(new Date(), 86_400),
          dead_lettered_at: new Date(),
          updated_at: new Date(),
        },
      });

      await prisma.webhookEndpoint.update({
        where: { id: job.webhook_id },
        data: {
          last_delivery_at: new Date(),
          last_delivery_status: "failed",
          last_error: policyError,
          updated_at: new Date(),
        },
      });

      return { delivered: false, skipped: true };
    }
  } catch {
    // Invalid endpoint URL is treated as a failed delivery policy check.
    await prisma.webhookDeliveryJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        last_error: "Invalid webhook endpoint URL",
        response_status: null,
        next_attempt_at: addSeconds(new Date(), 86_400),
        dead_lettered_at: new Date(),
        updated_at: new Date(),
      },
    });

    return { delivered: false, skipped: true };
  }

  const claimed = await prisma.webhookDeliveryJob.updateMany({
    where: {
      id: job.id,
      status: { in: ["queued", "failed"] },
    },
    data: {
      status: "processing",
      attempts: { increment: 1 },
      updated_at: new Date(),
    },
  });

  if (claimed.count === 0) {
    return { delivered: false, skipped: true };
  }

  const startedAt = new Date();
  const payloadString = JSON.stringify(job.payload);
  const timestamp = Math.floor(startedAt.getTime() / 1000).toString();
  const secret = decryptSigningSecret(job.webhook.signing_secret_encrypted);
  const signature = signWebhookPayload(payloadString, secret, timestamp);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      job.webhook.timeout_ms || DEFAULT_TIMEOUT_MS,
    );

    const response = await fetch(job.webhook.endpoint_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Blockmec-Webhook/1.0",
        "X-Blockmec-Event": job.event_type,
        "X-Blockmec-Delivery-Id": job.delivery_id,
        "X-Blockmec-Timestamp": timestamp,
        "X-Blockmec-Signature": signature,
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Webhook delivery failed with status ${response.status}`);
    }

    await prisma.webhookDeliveryJob.update({
      where: { id: job.id },
      data: {
        status: "delivered",
        response_status: response.status,
        delivered_at: new Date(),
        last_error: null,
        dead_lettered_at: null,
        updated_at: new Date(),
      },
    });

    await prisma.webhookEndpoint.update({
      where: { id: job.webhook_id },
      data: {
        last_delivery_at: new Date(),
        last_delivery_status: "delivered",
        last_error: null,
        updated_at: new Date(),
      },
    });

    return { delivered: true, skipped: false };
  } catch (error: any) {
    const attempts = job.attempts + 1;
    const maxRetries = job.webhook.max_retries || DEFAULT_RETRIES;
    const exhausted = attempts >= maxRetries;

    await prisma.webhookDeliveryJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        response_status: null,
        next_attempt_at: exhausted
          ? addSeconds(new Date(), 86_400)
          : addSeconds(new Date(), computeBackoffSeconds(attempts)),
        dead_lettered_at: exhausted ? new Date() : null,
        last_error: error?.message ?? "Unknown webhook delivery error",
        updated_at: new Date(),
      },
    });

    await prisma.webhookEndpoint.update({
      where: { id: job.webhook_id },
      data: {
        last_delivery_at: new Date(),
        last_delivery_status: exhausted ? "dead-lettered" : "failed",
        last_error: error?.message ?? "Unknown webhook delivery error",
        updated_at: new Date(),
      },
    });

    return { delivered: false, skipped: false };
  }
}

export async function dispatchPendingWebhookJobs(limit = 20) {
  const jobs = await prisma.webhookDeliveryJob.findMany({
    where: {
      status: { in: ["queued", "failed"] },
      dead_lettered_at: null,
      next_attempt_at: { lte: new Date() },
      webhook: { status: "active" },
    },
    orderBy: { created_at: "asc" },
    take: Math.max(1, Math.min(limit, 100)),
    select: { id: true },
  });

  let delivered = 0;
  let skipped = 0;

  for (const job of jobs) {
    const result = await deliverWebhookJob(job.id);
    if (result.delivered) delivered += 1;
    if (result.skipped) skipped += 1;
  }

  return {
    scanned: jobs.length,
    delivered,
    skipped,
  };
}
