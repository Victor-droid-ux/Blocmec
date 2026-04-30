// app/api/user/webhooks/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  hasAnyPermission,
  withScopedPermissionDefaults,
} from "@/lib/developer-policy";

const allowedEvents = [
  "qr.batch.completed",
  "qr.generated",
  "qr.codes.generated",
  "qr.verified",
] as const;

const webhookSelect = {
  id: true,
  name: true,
  endpoint_url: true,
  allowed_domains: true,
  events: true,
  status: true,
  timeout_ms: true,
  max_retries: true,
  api_key_id: true,
  last_delivery_at: true,
  last_delivery_status: true,
  last_error: true,
  created_at: true,
  updated_at: true,
} as const;

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

const updateWebhookSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  endpointUrl: z
    .string()
    .trim()
    .url()
    .refine((u) => u.startsWith("https://"), {
      message: "Webhook endpoint must use HTTPS",
    })
    .optional(),
  allowedDomains: z.array(z.string().trim().min(1)).max(50).optional(),
  events: z.array(z.enum(allowedEvents)).min(1).optional(),
  status: z.enum(["active", "paused", "disabled"]).optional(),
  timeoutMs: z.number().int().min(1000).max(30000).optional(),
  maxRetries: z.number().int().min(1).max(10).optional(),
});

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

async function getWebhookForUser(id: string, userId: string) {
  return prisma.webhookEndpoint.findFirst({
    where: { id, user_id: userId },
    select: webhookSelect,
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const webhook = await getWebhookForUser(id, user.id);

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json({ webhook });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to load webhook" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const normalizedBody = {
      ...body,
      endpointUrl: body?.endpointUrl ?? body?.endpoint_url,
      allowedDomains: body?.allowedDomains ?? body?.allowed_domains,
      timeoutMs: body?.timeoutMs ?? body?.timeout_ms,
      maxRetries: body?.maxRetries ?? body?.max_retries,
    };
    const parsed = updateWebhookSchema.safeParse(normalizedBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.webhookEndpoint.findFirst({
      where: { id, user_id: user.id },
      select: {
        id: true,
        api_key_id: true,
        endpoint_url: true,
        allowed_domains: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const data = parsed.data;

    const normalizedAllowedDomains = data.allowedDomains
      ? (Array.from(
          new Set(
            data.allowedDomains
              .map((domain) => normalizeDomain(domain))
              .filter(Boolean),
          ),
        ) as string[])
      : undefined;

    const targetEndpointUrl = data.endpointUrl ?? existing.endpoint_url;
    const targetEndpointHost = endpointHostFromUrl(targetEndpointUrl);
    const effectiveAllowedDomains =
      normalizedAllowedDomains ?? existing.allowed_domains;

    if (!isHostAllowed(targetEndpointHost, effectiveAllowedDomains)) {
      return NextResponse.json(
        {
          error:
            "Webhook endpoint host must match one of the webhook allowed domains.",
        },
        { status: 400 },
      );
    }

    if (existing.api_key_id) {
      const key = await prisma.apiKey.findFirst({
        where: {
          id: existing.api_key_id,
          user_id: user.id,
          status: "active",
          OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
        },
        select: { permissions: true, allowed_domains: true },
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

      if (key) {
        const keyAllowedDomains = key.allowed_domains
          .map((domain) => normalizeDomain(domain))
          .filter(Boolean) as string[];

        if (
          keyAllowedDomains.length > 0 &&
          !isHostAllowed(targetEndpointHost, keyAllowedDomains)
        ) {
          return NextResponse.json(
            {
              error:
                "Webhook endpoint host is not in the API key domain allowlist.",
            },
            { status: 403 },
          );
        }
      }
    }

    const updated = await prisma.webhookEndpoint.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.endpointUrl !== undefined && {
          endpoint_url: data.endpointUrl,
        }),
        ...(normalizedAllowedDomains !== undefined && {
          allowed_domains: normalizedAllowedDomains,
        }),
        ...(data.events !== undefined && { events: data.events }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.timeoutMs !== undefined && { timeout_ms: data.timeoutMs }),
        ...(data.maxRetries !== undefined && { max_retries: data.maxRetries }),
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        endpoint_url: true,
        allowed_domains: true,
        events: true,
        status: true,
        timeout_ms: true,
        max_retries: true,
        api_key_id: true,
        last_delivery_at: true,
        last_delivery_status: true,
        last_error: true,
        updated_at: true,
      },
    });

    return NextResponse.json({ message: "Webhook updated", webhook: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to update webhook" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.webhookEndpoint.findFirst({
      where: { id, user_id: user.id },
      select: {
        id: true,
        api_key_id: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    if (existing.api_key_id) {
      const key = await prisma.apiKey.findFirst({
        where: {
          id: existing.api_key_id,
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

    await prisma.webhookEndpoint.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Webhook deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete webhook" },
      { status: 500 },
    );
  }
}
