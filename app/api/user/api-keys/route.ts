//app/api/api-keys/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import {
  getPlanPolicy,
  withScopedPermissionDefaults,
} from "@/lib/developer-policy";

class AuthServiceUnavailableError extends Error {
  constructor(message = "Authentication service unavailable") {
    super(message);
    this.name = "AuthServiceUnavailableError";
  }
}

function serviceUnavailableResponse() {
  return NextResponse.json(
    {
      error: "Authentication service unavailable",
      code: "AUTH_SERVICE_UNAVAILABLE",
    },
    { status: 503 },
  );
}

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

  // Fallback for non-Vercel deployments where NODE_ENV=production denotes live prod.
  if (!vercelEnv && !appEnv && process.env.NODE_ENV === "production") {
    return true;
  }

  return false;
}

function isFreePlanApiKeyBypassAllowedForUser(
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

async function getUser() {
  const supabase = await createServerSupabaseClient();

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return prisma.user.findUnique({ where: { supabase_id: data.user.id } });
  } catch (error) {
    console.error("Supabase auth lookup failed in /api/user/api-keys:", error);
    throw new AuthServiceUnavailableError();
  }
}

// GET /api/user/api-keys
export async function GET(req: NextRequest) {
  let user;
  try {
    user = await getUser();
  } catch (error) {
    if (error instanceof AuthServiceUnavailableError) {
      return serviceUnavailableResponse();
    }
    throw error;
  }

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      key_prefix: true,
      name: true,
      status: true,
      permissions: true,
      created_at: true,
      expires_at: true,
      last_used_at: true,
    },
  });

  return NextResponse.json({ keys });
}

// POST /api/user/api-keys
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await getUser();
  } catch (error) {
    if (error instanceof AuthServiceUnavailableError) {
      return serviceUnavailableResponse();
    }
    throw error;
  }

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.status !== "active") {
    return NextResponse.json(
      { error: "Account is inactive or suspended", code: "ACCOUNT_INACTIVE" },
      { status: 403 },
    );
  }

  const plan = (user.subscription_plan ?? "free").toLowerCase();
  const freePlanBypassAllowed = isFreePlanApiKeyBypassAllowedForUser(user);

  if (plan === "free" && !freePlanBypassAllowed) {
    return NextResponse.json(
      {
        error:
          "API key generation requires an active subscription. Upgrade your plan to continue.",
        code: "SUBSCRIPTION_REQUIRED",
      },
      { status: 403 },
    );
  }

  const policy = getPlanPolicy(user.subscription_plan);
  const bypassMaxActiveKeys = parsePositiveIntEnv(
    process.env.API_KEY_BYPASS_MAX_ACTIVE_KEYS,
    5,
  );
  const maxActiveKeys =
    plan === "free" && freePlanBypassAllowed
      ? bypassMaxActiveKeys
      : policy.maxApiKeys;

  const currentKeyCount = await prisma.apiKey.count({
    where: {
      user_id: user.id,
      status: "active",
    },
  });

  if (currentKeyCount >= maxActiveKeys) {
    return NextResponse.json(
      {
        error: `API key limit reached for your current policy (${maxActiveKeys}).`,
        code: "PLAN_API_KEY_LIMIT_REACHED",
      },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const schema = z.object({
    name: z.string().optional(),
    permissions: z.record(z.string(), z.boolean()).optional(),
    expiryDays: z.number().nullable().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, permissions, expiryDays } = parsed.data;

  // Generate key
  const rawKey = `bm_${crypto.randomBytes(32).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.substring(0, 12);

  const expiresAt = expiryDays
    ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    : null;

  await prisma.apiKey.create({
    data: {
      user_id: user.id,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name: name ?? "My API Key",
      permissions: withScopedPermissionDefaults(permissions),
      status: "active",
      expires_at: expiresAt,
      updated_at: new Date(),
    },
  });

  return NextResponse.json({ key: rawKey, prefix: keyPrefix }, { status: 201 });
}

// DELETE /api/user/api-keys?id=xxx
export async function DELETE(req: NextRequest) {
  let user;
  try {
    user = await getUser();
  } catch (error) {
    if (error instanceof AuthServiceUnavailableError) {
      return serviceUnavailableResponse();
    }
    throw error;
  }

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "Key ID required" }, { status: 400 });

  const key = await prisma.apiKey.findFirst({
    where: { id, user_id: user.id },
  });
  if (!key)
    return NextResponse.json({ error: "Key not found" }, { status: 404 });

  await prisma.apiKey.update({
    where: { id },
    data: { status: "revoked", updated_at: new Date() },
  });

  return NextResponse.json({ message: "Key revoked successfully" });
}
