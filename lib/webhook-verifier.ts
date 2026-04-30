//lib/webhook-verifier.ts

import crypto from "crypto";
import { isReplayAndStore } from "@/lib/webhook-replay";

type VerifyOptions = {
  secret: string;
  rawBody: string;
  headers: Headers;
  replayNamespace: string;
  maxSkewSeconds?: number;
};

export async function verifySignedWebhookRequest(options: VerifyOptions) {
  const timestamp = options.headers.get("x-blockmec-timestamp") ?? "";
  const deliveryId = options.headers.get("x-blockmec-delivery-id") ?? "";
  const signature = options.headers.get("x-blockmec-signature") ?? "";

  if (!timestamp || !deliveryId || !signature) {
    return {
      ok: false as const,
      status: 401,
      error: "Missing signature headers",
    };
  }

  const timestampNumber = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(timestampNumber)) {
    return {
      ok: false as const,
      status: 401,
      error: "Invalid webhook timestamp",
    };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const maxSkew = options.maxSkewSeconds ?? 300;
  if (Math.abs(nowSeconds - timestampNumber) > maxSkew) {
    return {
      ok: false as const,
      status: 401,
      error: "Webhook timestamp outside accepted window",
    };
  }

  const expected = `v1=${crypto
    .createHmac("sha256", options.secret)
    .update(`${timestamp}.${options.rawBody}`)
    .digest("hex")}`;

  const suppliedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return {
      ok: false as const,
      status: 401,
      error: "Invalid webhook signature",
    };
  }

  const isReplay = await isReplayAndStore({
    namespace: options.replayNamespace,
    deliveryId,
    ttlSeconds: maxSkew,
  });

  if (isReplay) {
    return {
      ok: false as const,
      status: 409,
      error: "Replay detected for delivery id",
    };
  }

  return {
    ok: true as const,
    deliveryId,
    timestamp: timestampNumber,
  };
}
