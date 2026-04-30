import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { rateLimit } from "@/lib/rateLimiter";
import {
  doesPageMatchBoundDomain,
  normalizeBoundDomain,
  verifyScriptToken,
} from "@/lib/script-token";
import { enforceUserRateLimit } from "@/lib/plan-rate-limit";
import { getPlanPolicy, hasAnyPermission } from "@/lib/developer-policy";
import { publishWebhookEvent, WEBHOOK_EVENTS } from "@/lib/webhooks";

function hasApiKeyPermission(permissions: unknown, permission: string) {
  return hasAnyPermission(permissions, [permission, "qr:read"]);
}

export async function POST(req: NextRequest) {
  try {
    const baselineRateLimit = await rateLimit(req, {
      maxRequests: 120,
      windowMs: 60_000,
    });

    if (baselineRateLimit) {
      return baselineRateLimit;
    }

    const apiKeyHeader = req.headers.get("x-api-key");
    const scriptTokenHeader = req.headers.get("x-blockmec-script-token");
    let authorizedApiKeyUserId: string | null = null;
    let authorizedSubscriptionPlan: string | null = null;

    const fullApiKey =
      apiKeyHeader &&
      apiKeyHeader.startsWith("bm_") &&
      apiKeyHeader.length >= 40
        ? apiKeyHeader.trim()
        : null;

    if (fullApiKey) {
      const keyHash = crypto
        .createHash("sha256")
        .update(fullApiKey)
        .digest("hex");

      const apiKey = await prisma.apiKey.findFirst({
        where: {
          key_hash: keyHash,
          status: "active",
          OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
        },
        select: {
          id: true,
          user_id: true,
          permissions: true,
          user: {
            select: {
              status: true,
              subscription_plan: true,
            },
          },
        },
      });

      if (!apiKey) {
        return NextResponse.json(
          { success: false, message: "Invalid API key" },
          { status: 401 },
        );
      }

      if (!hasApiKeyPermission(apiKey.permissions, "verify")) {
        return NextResponse.json(
          {
            success: false,
            message: "API key does not have verify permission",
          },
          { status: 403 },
        );
      }

      if (!apiKey.user || apiKey.user.status !== "active") {
        return NextResponse.json(
          { success: false, message: "Account is inactive or suspended" },
          { status: 403 },
        );
      }

      authorizedApiKeyUserId = apiKey.user_id;
      authorizedSubscriptionPlan = apiKey.user.subscription_plan ?? "free";

      const keyOwner = await prisma.user.findUnique({
        where: { id: apiKey.user_id },
        select: { id: true, subscription_plan: true },
      });

      if (keyOwner) {
        const policy = getPlanPolicy(keyOwner.subscription_plan);
        const planRateLimit = await enforceUserRateLimit({
          userId: keyOwner.id,
          bucket: "qr-verify",
          maxRequests: policy.requestsPerMinute,
        });

        if (planRateLimit) {
          return planRateLimit;
        }
      }

      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { last_used_at: new Date(), updated_at: new Date() },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { tokenId, qrData, pageUrl, domain } = body;

    if (scriptTokenHeader) {
      const payload = verifyScriptToken(scriptTokenHeader);
      if (!payload) {
        return NextResponse.json(
          { success: false, message: "Invalid or expired script token" },
          { status: 401 },
        );
      }

      const apiKey = await prisma.apiKey.findFirst({
        where: {
          id: payload.apiKeyId,
          user_id: payload.userId,
          status: "active",
          OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
        },
        select: {
          id: true,
          user_id: true,
          permissions: true,
          user: {
            select: {
              status: true,
              subscription_plan: true,
            },
          },
        },
      });

      if (!apiKey) {
        return NextResponse.json(
          {
            success: false,
            message: "Script token API key is no longer active",
          },
          { status: 401 },
        );
      }

      if (!hasApiKeyPermission(apiKey.permissions, "verify")) {
        return NextResponse.json(
          {
            success: false,
            message: "API key does not have verify permission",
          },
          { status: 403 },
        );
      }

      if (!apiKey.user || apiKey.user.status !== "active") {
        return NextResponse.json(
          { success: false, message: "Account is inactive or suspended" },
          { status: 403 },
        );
      }

      if (
        !doesPageMatchBoundDomain({
          boundDomain: payload.domain,
          pageUrl: typeof pageUrl === "string" ? pageUrl : null,
          origin: req.headers.get("origin"),
          referer: req.headers.get("referer"),
        }) ||
        (typeof domain === "string" &&
          payload.domain !== normalizeBoundDomain(domain))
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Verification request does not match the bound domain",
          },
          { status: 403 },
        );
      }

      authorizedApiKeyUserId = apiKey.user_id;
      authorizedSubscriptionPlan = apiKey.user.subscription_plan ?? "free";

      const keyOwner = await prisma.user.findUnique({
        where: { id: apiKey.user_id },
        select: { id: true, subscription_plan: true },
      });

      if (keyOwner) {
        const policy = getPlanPolicy(keyOwner.subscription_plan);
        const planRateLimit = await enforceUserRateLimit({
          userId: keyOwner.id,
          bucket: "qr-verify",
          maxRequests: policy.requestsPerMinute,
        });

        if (planRateLimit) {
          return planRateLimit;
        }
      }

      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { last_used_at: new Date(), updated_at: new Date() },
      });
    }

    if (authorizedApiKeyUserId) {
      const planPolicy = getPlanPolicy(authorizedSubscriptionPlan);
      const planRateLimit = await rateLimit(
        req,
        {
          maxRequests: planPolicy.requestsPerMinute,
          windowMs: 60_000,
        },
        {
          keySuffix: `user:${authorizedApiKeyUserId}:qr-verify`,
        },
      );

      if (planRateLimit) {
        return planRateLimit;
      }
    }

    // Support both tokenId directly or extracting from qrData URL
    let resolvedTokenId = tokenId;
    if (!resolvedTokenId && qrData) {
      // Try to extract tokenId from verify URL e.g. https://blockmec.com/verify/BM-xxx
      const match = String(qrData).match(/\/verify\/([^/?]+)/);
      if (match) resolvedTokenId = match[1];
    }

    if (!resolvedTokenId) {
      return NextResponse.json(
        { success: false, message: "Token ID or QR data is required" },
        { status: 400 },
      );
    }

    const qrCode = await prisma.qrCode.findFirst({
      where: {
        token_id: resolvedTokenId,
        ...(authorizedApiKeyUserId ? { user_id: authorizedApiKeyUserId } : {}),
      },
      include: {
        user: {
          select: { name: true, email: true, username: true },
        },
      },
    });

    if (!qrCode) {
      return NextResponse.json({
        success: true,
        verified: false,
        message: "QR code not found or invalid",
        data: { tokenId: resolvedTokenId },
      });
    }

    // Check if expired
    if (qrCode.expires_at && qrCode.expires_at < new Date()) {
      await prisma.qrCode.update({
        where: { id: qrCode.id },
        data: { status: "expired", updated_at: new Date() },
      });
      return NextResponse.json({
        success: true,
        verified: false,
        message: "QR code has expired",
        data: { tokenId: resolvedTokenId, status: "expired" },
      });
    }

    // Check scan limit
    if (qrCode.scan_limit > 0 && qrCode.scan_count >= qrCode.scan_limit) {
      return NextResponse.json({
        success: true,
        verified: false,
        message: "QR code scan limit reached",
        data: { tokenId: resolvedTokenId, status: "limit_reached" },
      });
    }

    // Check status
    if (qrCode.status !== "active") {
      return NextResponse.json({
        success: true,
        verified: false,
        message: `QR code is ${qrCode.status}`,
        data: { tokenId: resolvedTokenId, status: qrCode.status },
      });
    }

    // Increment scan count
    await prisma.qrCode.update({
      where: { id: qrCode.id },
      data: {
        scan_count: { increment: 1 },
        updated_at: new Date(),
      },
    });

    // Record verification
    const ipAddress =
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const userAgent = req.headers.get("user-agent") ?? "unknown";

    await prisma.verification.create({
      data: {
        qr_code_id: qrCode.id,
        token_id: resolvedTokenId,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: "verified",
        verification_method: "qr_scan",
        metadata: authorizedApiKeyUserId
          ? {
              auth: scriptTokenHeader ? "script_token" : "api_key",
              apiKeyUserId: authorizedApiKeyUserId,
            }
          : undefined,
      },
    });

    // Publish webhook asynchronously for successful verification events.
    try {
      await publishWebhookEvent({
        userId: qrCode.user_id,
        batchId: qrCode.batch_id ?? undefined,
        eventType: WEBHOOK_EVENTS.QR_VERIFIED,
        summary: {
          token_id: resolvedTokenId,
          qr_code_id: qrCode.id,
          product_name: qrCode.product_name,
          product_type: qrCode.product_type,
          status: "verified",
          occurred_at: new Date().toISOString(),
        },
        payload: {
          token_id: resolvedTokenId,
          qr_code_id: qrCode.id,
          user_id: qrCode.user_id,
          batch_id: qrCode.batch_id,
          scan_count: qrCode.scan_count + 1,
          scan_limit: qrCode.scan_limit,
          expires_at: qrCode.expires_at?.toISOString() ?? null,
          verified_at: new Date().toISOString(),
          product_name: qrCode.product_name,
          product_type: qrCode.product_type,
          metadata: qrCode.metadata,
          issuer: qrCode.user
            ? (qrCode.user.username ?? qrCode.user.name ?? qrCode.user.email)
            : null,
        },
      });
    } catch (eventError) {
      console.error("Failed to publish qr.verified webhook event:", eventError);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Product successfully verified",
      data: {
        tokenId: resolvedTokenId,
        productName: qrCode.product_name,
        productType: qrCode.product_type,
        scanCount: qrCode.scan_count + 1,
        scanLimit: qrCode.scan_limit,
        expiresAt: qrCode.expires_at?.toISOString() ?? null,
        createdAt: qrCode.created_at.toISOString(),
        metadata: qrCode.metadata,
        issuer: qrCode.user
          ? (qrCode.user.username ?? qrCode.user.name ?? qrCode.user.email)
          : null,
      },
    });
  } catch (err: any) {
    console.error("Verification error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error during verification" },
      { status: 500 },
    );
  }
}
