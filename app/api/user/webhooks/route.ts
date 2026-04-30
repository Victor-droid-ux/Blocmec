// app/api/user/webhooks/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createWebhookSecretMaterial } from "@/lib/webhooks";
import {
  getPlanPolicy,
  hasAnyPermission,
  withScopedPermissionDefaults,
} from "@/lib/developer-policy";

function parseBooleanEnv(value: string | undefined) {
  return (value ?? "").trim().toLowerCase() === "true";
}

function parsePositiveIntEnv(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

function isProductionDeployment() {
  const vercelEnv = (process.env.VERCEL_ENV ?? "").trim().toLowerCase();
  const appEnv = (process.env.APP_ENV ?? "").trim().toLowerCase();

  if (vercelEnv === "production" || appEnv === "production") {
    return true;
  }

  if (!vercelEnv && !appEnv && process.env.NODE_ENV === "production") {
    return true;
  }

  return false;
}

function isFreePlanWebhookBypassAllowedForUser(
  user: { email?: string | null } | null,
) {
  const bypassEnabled = parseBooleanEnv(
    process.env.ALLOW_FREE_PLAN_API_KEYS_IN_NON_PROD,
  );

  if (!bypassEnabled || isProductionDeployment()) {
    return false;
  }

  const allowlistRaw = process.env.API_KEY_BYPASS_TEST_EMAILS ?? "";
  if (!allowlistRaw.trim()) {
    return true;
  }

  const userEmail = (user?.email ?? "").trim().toLowerCase();
  if (!userEmail) {
    return false;
  }

  const allowlist = new Set(
    allowlistRaw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );

  return allowlist.has(userEmail);
}

const allowedEvents = [
  "qr.batch.completed",
  "qr.generated",
  "qr.codes.generated",
  "qr.verified",
] as const;

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

const createWebhookSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  endpointUrl: z
    .string()
    .trim()
    .url()
    .refine((u) => u.startsWith("https://"), {
      message: "Webhook endpoint must use HTTPS",
    }),
  apiKeyId: z.string().uuid().optional(),
  allowedDomains: z.array(z.string().trim().min(1)).max(50).optional(),
  events: z.array(z.enum(allowedEvents)).min(1).default(["qr.batch.completed"]),
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

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const webhooks = await prisma.webhookEndpoint.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
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
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({ webhooks });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to load webhooks" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Account is inactive or suspended", code: "ACCOUNT_INACTIVE" },
        { status: 403 },
      );
    }

    const plan = (user.subscription_plan ?? "free").toLowerCase();
    const freePlanBypassAllowed = isFreePlanWebhookBypassAllowedForUser(user);

    if (plan === "free" && !freePlanBypassAllowed) {
      return NextResponse.json(
        {
          error: "Webhook setup requires an active subscription.",
          code: "SUBSCRIPTION_REQUIRED",
        },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      apiKeyId,
      endpointUrl,
      allowedDomains,
      events,
      maxRetries,
      timeoutMs,
      name,
    } = parsed.data;

    const endpointHost = endpointHostFromUrl(endpointUrl);
    const normalizedAllowedDomains = Array.from(
      new Set(
        (allowedDomains ?? [])
          .map((domain) => normalizeDomain(domain))
          .filter(Boolean),
      ),
    ) as string[];

    if (!isHostAllowed(endpointHost, normalizedAllowedDomains)) {
      return NextResponse.json(
        {
          error:
            "Webhook endpoint host must match one of the webhook allowed domains.",
        },
        { status: 400 },
      );
    }

    const policy = getPlanPolicy(user.subscription_plan);
    const bypassMaxActiveWebhooks = parsePositiveIntEnv(
      process.env.API_KEY_BYPASS_MAX_ACTIVE_KEYS,
      5,
    );
    const maxActiveWebhooks =
      plan === "free" && freePlanBypassAllowed
        ? bypassMaxActiveWebhooks
        : policy.maxWebhooks;
    const currentWebhookCount = await prisma.webhookEndpoint.count({
      where: {
        user_id: user.id,
        status: { in: ["active", "paused"] },
      },
    });

    if (currentWebhookCount >= maxActiveWebhooks) {
      return NextResponse.json(
        {
          error: `Webhook limit reached for your plan (${maxActiveWebhooks}).`,
          code: "PLAN_WEBHOOK_LIMIT_REACHED",
        },
        { status: 403 },
      );
    }

    const key = apiKeyId
      ? await prisma.apiKey.findFirst({
          where: {
            id: apiKeyId,
            user_id: user.id,
            status: "active",
            OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
          },
          select: { id: true, permissions: true, allowed_domains: true },
        })
      : null;

    if (apiKeyId && !key) {
      return NextResponse.json(
        { error: "Invalid or inactive API key" },
        { status: 400 },
      );
    }

    if (key) {
      const scopedPermissions = withScopedPermissionDefaults(key.permissions);
      if (!hasAnyPermission(scopedPermissions, ["webhook:manage", "admin"])) {
        return NextResponse.json(
          { error: "API key lacks webhook:manage permission" },
          { status: 403 },
        );
      }
    }

    const secret = createWebhookSecretMaterial();

    if (
      key &&
      key.allowed_domains.length > 0 &&
      !isHostAllowed(
        endpointHost,
        key.allowed_domains
          .map((domain) => normalizeDomain(domain))
          .filter(Boolean) as string[],
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Webhook endpoint host is not in the API key domain allowlist.",
        },
        { status: 403 },
      );
    }

    const webhook = await prisma.webhookEndpoint.create({
      data: {
        user_id: user.id,
        api_key_id: apiKeyId ?? null,
        name: name ?? "Primary webhook",
        endpoint_url: endpointUrl,
        allowed_domains: normalizedAllowedDomains,
        events,
        signing_secret_hash: secret.hash,
        signing_secret_encrypted: secret.encrypted,
        timeout_ms: timeoutMs ?? 10000,
        max_retries: maxRetries ?? 6,
        status: "active",
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
        created_at: true,
      },
    });

    return NextResponse.json(
      {
        message: "Webhook created",
        webhook,
        signingSecret: secret.plain,
        signing_secret: secret.plain,
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create webhook" },
      { status: 500 },
    );
  }
}
