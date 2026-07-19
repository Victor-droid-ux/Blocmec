import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimiter";
import {
  createOptionalServerSupabaseClient,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import { UserRole } from "@/prisma/generated/enums";
import { signUpSchema, type SignUpInput } from "@/lib/validation";
import { User } from "@/types/store/user";

function resolveSafeNextPath(nextPath: unknown) {
  if (typeof nextPath !== "string") {
    return null;
  }

  const trimmed = nextPath.trim();
  const isDashboardPath = /^\/dashboard(?:\/.*)?$/.test(trimmed);
  if (!isDashboardPath) {
    return null;
  }

  if (
    trimmed.includes("://") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\")
  ) {
    return null;
  }

  return trimmed;
}

function generateDevUUID() {
  return randomUUID();
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, {
      maxRequests: 5,
      windowMs: 60_000,
    });

    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await req.json().catch(() => ({}));
    const parsed = signUpSchema.safeParse(body as unknown);
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error);
      return NextResponse.json({ error: flat }, { status: 400 });
    }

    const input = parsed.data as SignUpInput;
    const email = input.email.trim().toLowerCase();
    const displayName = input.name.trim();
    const companyName = input.companyName?.trim() || null;
    const nextPath = resolveSafeNextPath(
      (body as Record<string, unknown>).next,
    );

    if (!hasSupabaseEnv()) {
      if (process.env.NODE_ENV !== "development") {
        return NextResponse.json(
          { error: "Authentication service not configured" },
          { status: 503 },
        );
      }

      const existingDevUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingDevUser) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 },
        );
      }

      const user = await prisma.user.create({
        data: {
          email,
          name: displayName,
          username: companyName ?? displayName,
          role: UserRole.user,
          supabase_id: generateDevUUID(),
          email_verified: true,
        },
      });

      const publicUser: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      return NextResponse.json(
        {
          user: publicUser,
          signedIn: true,
          requiresEmailVerification: false,
          message: "Account created successfully",
        },
        { status: 201 },
      );
    }

    const supabase = await createOptionalServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Authentication service not configured" },
        { status: 503 },
      );
    }

    const callbackUrl = new URL(`${req.nextUrl.origin}/auth/callback`);
    if (nextPath) {
      callbackUrl.searchParams.set("next", nextPath);
    }

    const redirectTo = callbackUrl.toString();
    const userMetadata = {
      full_name: displayName,
      company_name: companyName,
    };

    let { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        emailRedirectTo: redirectTo,
        data: userMetadata,
      },
    });

    if (
      error &&
      (error.message || "")
        .toLowerCase()
        .includes("error sending confirmation email")
    ) {
      // Fallback: rely on Supabase default Site URL when custom redirect URL is rejected.
      const retry = await supabase.auth.signUp({
        email,
        password: input.password,
        options: {
          data: userMetadata,
        },
      });
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      const message = error.message || "Unable to create account";
      const lower = message.toLowerCase();

      if (
        lower.includes("email rate") ||
        lower.includes("rate limit") ||
        lower.includes("too many requests")
      ) {
        return NextResponse.json(
          {
            error:
              "Signup email delivery is temporarily rate-limited by the authentication provider. Please wait about a minute, then retry or use resend verification.",
            source: "auth_provider",
            cooldownSeconds: 60,
          },
          { status: 429 },
        );
      }

      if (lower.includes("error sending confirmation email")) {
        return NextResponse.json(
          {
            error:
              "Unable to send verification email. Check your Supabase SMTP setup and allowed redirect URLs, then try again.",
            source: "auth_provider",
            hint: "Ensure your callback URL is listed under Supabase Auth Redirect URLs.",
            providerMessage: message,
            providerCode:
              typeof (error as { code?: unknown })?.code === "string"
                ? (error as { code: string }).code
                : null,
            providerStatus:
              typeof (error as { status?: unknown })?.status === "number"
                ? (error as { status: number }).status
                : null,
          },
          { status: 400 },
        );
      }

      const status = message.toLowerCase().includes("already") ? 409 : 400;
      return NextResponse.json({ error: message }, { status });
    }

    const supabaseUser = data.user;
    const signedIn = Boolean(data.session);

    if (!supabaseUser?.id) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            email,
            name: displayName,
            username: companyName ?? displayName,
            role: UserRole.user,
            email_verified: false,
          },
        });
      }

      return NextResponse.json(
        {
          user: null,
          signedIn: false,
          requiresEmailVerification: true,
          message:
            "Signup request accepted. Please check your email for a verification link.",
        },
        { status: 200 },
      );
    }

    const prismaUser = await prisma.user.upsert({
      where: { email },
      update: {
        supabase_id: supabaseUser.id,
        name: displayName,
        username: companyName ?? displayName,
        role: UserRole.user,
        email_verified: signedIn,
        updated_at: new Date(),
      },
      create: {
        email,
        supabase_id: supabaseUser.id,
        name: displayName,
        username: companyName ?? displayName,
        role: UserRole.user,
        email_verified: signedIn,
      },
    });

    const publicUser: User = {
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      role: prismaUser.role,
    };

    return NextResponse.json(
      {
        user: publicUser,
        signedIn,
        requiresEmailVerification: !signedIn,
        message: signedIn
          ? "Account created and signed in"
          : "Account created. Please verify your email to continue.",
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
