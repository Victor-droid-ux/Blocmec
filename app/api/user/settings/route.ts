import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rateLimiter";
import { UserRole } from "@/prisma/generated/enums";
import { updateUserSettingsSchema } from "@/lib/validation";

function normalizeOptionalString(value: string | undefined) {
  if (typeof value === "undefined") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

async function resolveAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: supUser },
    error: supError,
  } = await supabase.auth.getUser();

  if (supError || !supUser?.id) {
    return null;
  }

  let user = await prisma.user.findUnique({
    where: { supabase_id: supUser.id },
  });

  const normalizedEmail = supUser.email?.trim().toLowerCase();
  if (!user && normalizedEmail) {
    user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  }

  if (!user && normalizedEmail) {
    user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        supabase_id: supUser.id,
        email_verified: Boolean(supUser.email_confirmed_at),
        updated_at: new Date(),
      },
      create: {
        email: normalizedEmail,
        supabase_id: supUser.id,
        name: supUser.user_metadata?.full_name ?? null,
        role: UserRole.user,
        email_verified: Boolean(supUser.email_confirmed_at),
      },
    });
  }

  return user;
}

function buildSettingsResponse(
  user: Awaited<ReturnType<typeof resolveAuthenticatedUser>>,
  settings: {
    company_name?: string | null;
    company_email?: string | null;
    company_website?: string | null;
    company_address?: string | null;
    timezone?: string;
    language?: string;
    date_format?: string;
    email_notifications?: boolean;
    sms_notifications?: boolean;
    push_notifications?: boolean;
    two_factor_auth?: boolean;
    session_timeout_minutes?: number;
    api_access_enabled?: boolean;
  } | null,
) {
  return {
    companyName: settings?.company_name ?? user?.username ?? user?.name ?? "",
    companyEmail: settings?.company_email ?? user?.email ?? "",
    companyWebsite: settings?.company_website ?? "",
    companyAddress: settings?.company_address ?? "",
    timezone: settings?.timezone ?? "America/New_York",
    language: settings?.language ?? "en-US",
    dateFormat: settings?.date_format ?? "MM/DD/YYYY",
    emailNotifications: settings?.email_notifications ?? true,
    smsNotifications: settings?.sms_notifications ?? false,
    pushNotifications: settings?.push_notifications ?? true,
    twoFactorAuth: settings?.two_factor_auth ?? false,
    sessionTimeout: String(settings?.session_timeout_minutes ?? 30),
    apiAccessEnabled: settings?.api_access_enabled ?? true,
    apiRateLimits: {
      perMinute: 60,
      perDay: 10_000,
    },
  };
}

export async function GET() {
  try {
    const user = await resolveAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { user_id: user.id },
    });

    return NextResponse.json({
      settings: buildSettingsResponse(user, settings),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, {
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (rateLimitResult) return rateLimitResult;

    const user = await resolveAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateUserSettingsSchema.safeParse(body as unknown);
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error);
      return NextResponse.json({ error: flat }, { status: 400 });
    }

    const input = parsed.data;
    const settingsUpdate: Record<string, unknown> = {};
    const userUpdate: Record<string, unknown> = {};

    if (typeof input.companyName !== "undefined") {
      const companyName = normalizeOptionalString(input.companyName);
      settingsUpdate.company_name = companyName;
      userUpdate.username = companyName;
    }

    if (typeof input.companyEmail !== "undefined") {
      settingsUpdate.company_email = normalizeOptionalString(
        input.companyEmail,
      );
    }

    if (typeof input.companyWebsite !== "undefined") {
      settingsUpdate.company_website = normalizeOptionalString(
        input.companyWebsite,
      );
    }

    if (typeof input.companyAddress !== "undefined") {
      settingsUpdate.company_address = normalizeOptionalString(
        input.companyAddress,
      );
    }

    if (typeof input.timezone !== "undefined") {
      settingsUpdate.timezone = input.timezone.trim();
    }

    if (typeof input.language !== "undefined") {
      settingsUpdate.language = input.language.trim();
    }

    if (typeof input.dateFormat !== "undefined") {
      settingsUpdate.date_format = input.dateFormat.trim();
    }

    if (typeof input.emailNotifications !== "undefined") {
      settingsUpdate.email_notifications = input.emailNotifications;
    }

    if (typeof input.smsNotifications !== "undefined") {
      settingsUpdate.sms_notifications = input.smsNotifications;
    }

    if (typeof input.pushNotifications !== "undefined") {
      settingsUpdate.push_notifications = input.pushNotifications;
    }

    if (typeof input.twoFactorAuth !== "undefined") {
      settingsUpdate.two_factor_auth = input.twoFactorAuth;
    }

    if (typeof input.sessionTimeout !== "undefined") {
      settingsUpdate.session_timeout_minutes = input.sessionTimeout;
    }

    if (typeof input.apiAccessEnabled !== "undefined") {
      settingsUpdate.api_access_enabled = input.apiAccessEnabled;
    }

    const [updatedUser, settings] = await prisma.$transaction([
      Object.keys(userUpdate).length
        ? prisma.user.update({
            where: { id: user.id },
            data: { ...userUpdate, updated_at: new Date() },
          })
        : prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
      prisma.userSettings.upsert({
        where: { user_id: user.id },
        update: settingsUpdate,
        create: {
          user_id: user.id,
          company_name:
            typeof settingsUpdate.company_name === "undefined"
              ? (user.username ?? user.name ?? null)
              : (settingsUpdate.company_name as string | null),
          company_email:
            typeof settingsUpdate.company_email === "undefined"
              ? user.email
              : (settingsUpdate.company_email as string | null),
          company_website:
            (settingsUpdate.company_website as string | null | undefined) ??
            null,
          company_address:
            (settingsUpdate.company_address as string | null | undefined) ??
            null,
          timezone:
            (settingsUpdate.timezone as string | undefined) ??
            "America/New_York",
          language: (settingsUpdate.language as string | undefined) ?? "en-US",
          date_format:
            (settingsUpdate.date_format as string | undefined) ?? "MM/DD/YYYY",
          email_notifications:
            (settingsUpdate.email_notifications as boolean | undefined) ?? true,
          sms_notifications:
            (settingsUpdate.sms_notifications as boolean | undefined) ?? false,
          push_notifications:
            (settingsUpdate.push_notifications as boolean | undefined) ?? true,
          two_factor_auth:
            (settingsUpdate.two_factor_auth as boolean | undefined) ?? false,
          session_timeout_minutes:
            (settingsUpdate.session_timeout_minutes as number | undefined) ??
            30,
          api_access_enabled:
            (settingsUpdate.api_access_enabled as boolean | undefined) ?? true,
        },
      }),
    ]);

    return NextResponse.json({
      settings: buildSettingsResponse(updatedUser, settings),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
