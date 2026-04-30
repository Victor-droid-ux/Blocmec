//app/api/generate-qr.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import QRCode from "qrcode";
import { rateLimit } from "@/lib/rateLimiter";
import { publishWebhookEvent, WEBHOOK_EVENTS } from "@/lib/webhooks";
import crypto from "crypto";
import { enforceUserRateLimit } from "@/lib/plan-rate-limit";
import { getPlanPolicy, hasAnyPermission } from "@/lib/developer-policy";

const generateQrSchema = z.object({
  productName: z.string().min(1),
  productType: z.string().min(1),
  batchNumber: z.string().optional(),
  companyRegNo: z.string().optional(),
  quantity: z.number().int().min(1).max(10000),
  description: z.string().optional(),
  expiryDays: z.number().int().min(1).optional(),
  scanLimit: z.number().int().min(0).default(0),
  metadata: z.record(z.string(), z.any()).optional(),
});

function generateTokenId(): string {
  return `BM-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

function hasApiKeyPermission(permissions: unknown, permission: string) {
  return hasAnyPermission(permissions, [permission, "qr:generate"]);
}

async function resolveAuthenticatedUser(req: NextRequest) {
  const apiKeyHeader = req.headers.get("x-api-key");

  if (apiKeyHeader) {
    const keyHash = crypto
      .createHash("sha256")
      .update(apiKeyHeader.trim())
      .digest("hex");

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        key_hash: keyHash,
        status: "active",
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
      include: { user: true },
    });

    if (!apiKey || !apiKey.user) {
      return {
        user: null,
        response: NextResponse.json(
          { error: "Invalid API key" },
          { status: 401 },
        ),
      };
    }

    if (!hasApiKeyPermission(apiKey.permissions, "write")) {
      return {
        user: null,
        response: NextResponse.json(
          { error: "API key does not have write permission" },
          { status: 403 },
        ),
      };
    }

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { last_used_at: new Date(), updated_at: new Date() },
    });

    return { user: apiKey.user, response: null };
  }

  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  let dbUser = await prisma.user.findUnique({
    where: { supabase_id: authData.user.id },
  });

  if (!dbUser && authData.user.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: authData.user.email },
    });
  }

  if (!dbUser) {
    return {
      user: null,
      response: NextResponse.json({ error: "User not found" }, { status: 404 }),
    };
  }

  return { user: dbUser, response: null };
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, {
      maxRequests: 10,
      windowMs: 60000,
    });
    if (rateLimitResult) return rateLimitResult;

    const auth = await resolveAuthenticatedUser(req);
    if (auth.response) {
      return auth.response;
    }
    const dbUser = auth.user!;

    if (dbUser.status !== "active") {
      return NextResponse.json(
        { error: "Account is inactive or suspended", code: "ACCOUNT_INACTIVE" },
        { status: 403 },
      );
    }

    const planPolicy = getPlanPolicy(dbUser.subscription_plan);
    const planRateLimit = await rateLimit(
      req,
      {
        maxRequests: planPolicy.requestsPerMinute,
        windowMs: 60_000,
      },
      {
        keySuffix: `user:${dbUser.id}:qr-generate`,
      },
    );

    if (planRateLimit) {
      return planRateLimit;
    }

    const policy = getPlanPolicy(dbUser.subscription_plan);
    const planRateLimitResponse = await enforceUserRateLimit({
      userId: dbUser.id,
      bucket: "qr-generate",
      maxRequests: policy.requestsPerMinute,
    });
    if (planRateLimitResponse) {
      return planRateLimitResponse;
    }

    // Check credits
    if (dbUser.api_credits <= 0) {
      return NextResponse.json(
        { error: "Insufficient API credits" },
        { status: 402 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = generateQrSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      productName,
      productType,
      batchNumber,
      companyRegNo,
      quantity,
      description,
      expiryDays,
      scanLimit,
      metadata,
    } = parsed.data;

    // Deduct credits
    if (dbUser.api_credits < quantity) {
      return NextResponse.json(
        {
          error: `Insufficient credits. You need ${quantity} credits but have ${dbUser.api_credits}`,
        },
        { status: 402 },
      );
    }

    // Calculate expiry
    const expiresAt = expiryDays
      ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
      : null;

    // Create batch
    const batch = await prisma.batch.create({
      data: {
        user_id: dbUser.id,
        name: `${productName} - ${batchNumber || new Date().toISOString().split("T")[0]}`,
        product_type: productType,
        batch_number: batchNumber,
        total_count: quantity,
        generated_count: 0,
        status: "processing",
        metadata: {
          companyRegNo,
          description,
          ...metadata,
        },
        updated_at: new Date(),
      },
    });

    // Generate QR codes
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://blockmec.com";
    const qrCodes = [];

    for (let i = 0; i < quantity; i++) {
      const tokenId = generateTokenId();
      const verifyUrl = `${baseUrl}/verify/${tokenId}`;

      // Generate QR image as data URL
      const qrImageDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 512,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      });

      qrCodes.push({
        user_id: dbUser.id,
        token_id: tokenId,
        batch_id: batch.id,
        product_type: productType,
        product_name: productName,
        qr_data: verifyUrl,
        qr_image_url: qrImageDataUrl,
        scan_limit: scanLimit,
        scan_count: 0,
        expires_at: expiresAt,
        status: "active" as const,
        metadata: {
          batchNumber,
          companyRegNo,
          description,
          index: i + 1,
          total: quantity,
          ...metadata,
        },
        updated_at: new Date(),
      });
    }

    // Bulk insert QR codes
    await prisma.qrCode.createMany({ data: qrCodes });

    // Update batch status and generated count
    await prisma.batch.update({
      where: { id: batch.id },
      data: {
        generated_count: quantity,
        status: "completed",
        updated_at: new Date(),
      },
    });

    // Deduct credits from user
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        api_credits: { decrement: quantity },
        updated_at: new Date(),
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: dbUser.id,
        action: "generate_qr_batch",
        resource_type: "Batch",
        resource_id: batch.id,
        metadata: { productName, productType, quantity },
      },
    });

    const occurredAt = new Date().toISOString();

    // Fire and forget so webhook queuing does not delay QR generation responses.
    void (async () => {
      try {
        const sharedSummary = {
          batch_id: batch.id,
          qr_count: quantity,
          product_name: productName,
          product_type: productType,
          occurred_at: occurredAt,
        };

        await Promise.allSettled([
          publishWebhookEvent({
            userId: dbUser.id,
            batchId: batch.id,
            eventType: WEBHOOK_EVENTS.QR_BATCH_COMPLETED,
            summary: sharedSummary,
            payload: {
              event: WEBHOOK_EVENTS.QR_BATCH_COMPLETED,
              occurred_at: occurredAt,
              user_id: dbUser.id,
              batch_id: batch.id,
              qr_count: quantity,
              product_name: productName,
              product_type: productType,
              message: "QR batch generation completed.",
            },
          }),
          publishWebhookEvent({
            userId: dbUser.id,
            batchId: batch.id,
            eventType: WEBHOOK_EVENTS.QR_GENERATED,
            summary: {
              ...sharedSummary,
              delivery_hint: "Use payload_ref to fetch generated QR details.",
            },
            payload: {
              event: WEBHOOK_EVENTS.QR_GENERATED,
              occurred_at: occurredAt,
              user_id: dbUser.id,
              batch_id: batch.id,
              qr_count: quantity,
              product_name: productName,
              product_type: productType,
              include: ["qrcodes"],
            },
          }),
          publishWebhookEvent({
            userId: dbUser.id,
            batchId: batch.id,
            eventType: WEBHOOK_EVENTS.QR_CODES_GENERATED,
            summary: {
              ...sharedSummary,
              delivery_hint: "Use payload_ref to fetch generated QR details.",
            },
            payload: {
              event: WEBHOOK_EVENTS.QR_CODES_GENERATED,
              occurred_at: occurredAt,
              user_id: dbUser.id,
              batch_id: batch.id,
              qr_count: quantity,
              product_name: productName,
              product_type: productType,
              include: ["qrcodes"],
            },
          }),
        ]);
      } catch (webhookError) {
        console.error("[webhook] publish failed:", webhookError);
      }
    })();

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      quantity,
      productName,
      productType,
      message: `Successfully generated ${quantity} QR codes`,
    });
  } catch (err: any) {
    console.error("QR generation error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to generate QR codes" },
      { status: 500 },
    );
  }
}
