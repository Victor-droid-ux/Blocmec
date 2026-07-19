import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type PaystackWebhookPayload = {
  event?: string;
  data?: {
    id?: number;
    reference?: string;
    amount?: number;
    currency?: string;
    customer?: {
      email?: string;
    };
    metadata?: Record<string, unknown>;
    status?: string;
  };
};

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

function asObject(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return {};
}

function secureCompare(signature: string, expected: string) {
  if (!signature || !expected || signature.length !== expected.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < signature.length; i += 1) {
    mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }

  return mismatch === 0;
}

export async function POST(req: NextRequest) {
  try {
    const webhookSecret =
      process.env.PAYSTACK_WEBHOOK_SECRET ?? process.env.PAYSTACK_SECRET_KEY;

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Paystack webhook secret is not configured" },
        { status: 500 },
      );
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") ?? "";
    const expectedSignature = createHmac("sha512", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (!secureCompare(signature, expectedSignature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as PaystackWebhookPayload;
    const event = payload.event ?? "unknown";
    const reference = payload.data?.reference ?? null;
    const providerId =
      typeof payload.data?.id === "number" ? String(payload.data.id) : null;
    const customerEmail =
      payload.data?.customer?.email?.trim().toLowerCase() ?? null;
    const eventKey = `${event}:${providerId ?? "none"}:${reference ?? "none"}`;

    let userId: string | null = null;
    if (customerEmail) {
      const user = await prisma.user.findUnique({
        where: { email: customerEmail },
        select: { id: true },
      });
      userId = user?.id ?? null;
    }

    if (reference) {
      const existing = await prisma.transaction.findFirst({
        where: { transaction_reference: reference },
        select: { id: true, status: true, metadata: true },
      });

      if (existing) {
        const metadata = asObject(existing.metadata);
        const processedKeys = Array.isArray(metadata.processedWebhookKeys)
          ? metadata.processedWebhookKeys.filter(
              (key): key is string => typeof key === "string",
            )
          : [];
        const alreadyProcessed = processedKeys.includes(eventKey);

        if (!alreadyProcessed) {
          const nextStatus =
            event === "charge.success" || payload.data?.status === "success"
              ? "completed"
              : event === "charge.failed" || payload.data?.status === "failed"
                ? existing.status === "completed"
                  ? "completed"
                  : "failed"
                : existing.status;

          const mergedMetadata: JsonObject = {
            ...metadata,
            webhookEvent: event,
            payloadStatus: payload.data?.status ?? null,
            webhookReceivedAt: new Date().toISOString(),
            processedWebhookKeys: [...processedKeys, eventKey],
          };

          await prisma.transaction.update({
            where: { id: existing.id },
            data: {
              status: nextStatus,
              payment_provider_id: providerId ?? undefined,
              metadata: mergedMetadata,
              updated_at: new Date(),
            },
          });
        }

        await prisma.auditLog.create({
          data: {
            user_id: userId,
            action: "paystack_webhook_received",
            resource_type: "Transaction",
            resource_id: existing.id,
            metadata: {
              event,
              reference,
              providerId,
              status: payload.data?.status ?? null,
              amountMinor: payload.data?.amount ?? null,
              currency: payload.data?.currency ?? null,
              deduplicated: alreadyProcessed,
            },
          },
        });

        return NextResponse.json({
          received: true,
          deduplicated: alreadyProcessed,
        });
      }

      await prisma.auditLog.create({
        data: {
          user_id: userId,
          action: "paystack_webhook_received_unmatched",
          resource_type: "Transaction",
          metadata: {
            event,
            reference,
            providerId,
            status: payload.data?.status ?? null,
            amountMinor: payload.data?.amount ?? null,
            currency: payload.data?.currency ?? null,
          },
        },
      });

      return NextResponse.json({ received: true, matched: false });
    }

    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: "paystack_webhook_received_missing_reference",
        resource_type: "Transaction",
        metadata: {
          event,
          providerId,
          status: payload.data?.status ?? null,
          amountMinor: payload.data?.amount ?? null,
          currency: payload.data?.currency ?? null,
        },
      },
    });

    return NextResponse.json({ received: true, matched: false });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to process Paystack webhook" },
      { status: 500 },
    );
  }
}
