//app/api/user/webhooks/[id]/test/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { decryptSigningSecret, signWebhookPayload } from "@/lib/webhooks";
import {
  hasAnyPermission,
  withScopedPermissionDefaults,
} from "@/lib/developer-policy";
import crypto from "crypto";

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

function isHostAllowed(host: string, allowedDomains: string[]) {
  if (allowedDomains.length === 0) return true;
  return allowedDomains.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}

async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  let user = await prisma.user.findUnique({
    where: { supabase_id: data.user.id },
  });

  if (!user && data.user.email) {
    user = await prisma.user.findUnique({ where: { email: data.user.email } });
  }

  return user;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const webhook = await prisma.webhookEndpoint.findFirst({
      where: { id, user_id: user.id },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    if (webhook.api_key_id) {
      const key = await prisma.apiKey.findFirst({
        where: {
          id: webhook.api_key_id,
          user_id: user.id,
          status: "active",
          OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
        },
        select: { permissions: true },
      });

      const scopedPermissions = key
        ? withScopedPermissionDefaults(key.permissions)
        : null;

      if (
        !scopedPermissions ||
        !hasAnyPermission(scopedPermissions, ["webhook:manage", "admin"])
      ) {
        return NextResponse.json(
          {
            error: "API key requires webhook:manage permission",
            code: "MISSING_WEBHOOK_PERMISSION",
          },
          { status: 403 },
        );
      }
    }

    const deliveryId = `test_${crypto.randomUUID()}`;
    const occurredAt = new Date().toISOString();

    const endpointHost = new URL(webhook.endpoint_url).hostname
      .trim()
      .toLowerCase()
      .replace(/\.$/, "");

    const normalizedAllowedDomains = webhook.allowed_domains
      .map((domain) => normalizeDomain(domain))
      .filter(Boolean) as string[];

    if (!isHostAllowed(endpointHost, normalizedAllowedDomains)) {
      return NextResponse.json(
        {
          error:
            "Webhook endpoint host does not match configured webhook allowed domains.",
        },
        { status: 400 },
      );
    }

    const payload = {
      event: "webhook.test",
      delivery_id: deliveryId,
      occurred_at: occurredAt,
      user_id: user.id,
      webhook_id: webhook.id,
      data: {
        message: "This is a test webhook delivery from Blockmec.",
      },
    };

    const payloadString = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = signWebhookPayload(
      payloadString,
      decryptSigningSecret(webhook.signing_secret_encrypted),
      timestamp,
    );

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      webhook.timeout_ms || 10000,
    );

    try {
      const response = await fetch(webhook.endpoint_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Blockmec-Webhook/1.0",
          "X-Blockmec-Event": "webhook.test",
          "X-Blockmec-Delivery-Id": deliveryId,
          "X-Blockmec-Timestamp": timestamp,
          "X-Blockmec-Signature": signature,
        },
        body: payloadString,
        signal: controller.signal,
      });

      if (!response.ok) {
        await prisma.webhookEndpoint.update({
          where: { id: webhook.id },
          data: {
            last_delivery_at: new Date(),
            last_delivery_status: "failed",
            last_error: `Test delivery failed with status ${response.status}`,
            updated_at: new Date(),
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: "Test delivery failed",
            http_status: response.status,
            delivery_id: deliveryId,
          },
          { status: 502 },
        );
      }

      await prisma.webhookEndpoint.update({
        where: { id: webhook.id },
        data: {
          last_delivery_at: new Date(),
          last_delivery_status: "delivered",
          last_error: null,
          updated_at: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Test delivery sent successfully",
        http_status: response.status,
        delivery_id: deliveryId,
      });
    } catch (error: any) {
      await prisma.webhookEndpoint.update({
        where: { id: webhook.id },
        data: {
          last_delivery_at: new Date(),
          last_delivery_status: "failed",
          last_error:
            error?.name === "AbortError"
              ? "Request timed out"
              : (error?.message ?? "Test delivery failed"),
          updated_at: new Date(),
        },
      });

      return NextResponse.json(
        {
          success: false,
          error:
            error?.name === "AbortError"
              ? "Request timed out"
              : (error?.message ?? "Failed to send test delivery"),
          delivery_id: deliveryId,
        },
        { status: 502 },
      );
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to send test delivery" },
      { status: 500 },
    );
  }
}
