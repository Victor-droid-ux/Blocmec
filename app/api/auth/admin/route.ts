import { NextResponse } from "next/server";
import {
  createOptionalServerSupabaseClient,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import z from "zod";
import prisma from "@/lib/prisma";
import { signInSchema, type SignInInput } from "@/lib/validation";
import { rateLimit } from "@/lib/rateLimiter";
import { NextRequest } from "next/server";
import { User } from "@/types/store/user";
import { UserRole } from "@/prisma/generated/enums";

function generateDevUUID() {
  return `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, "0")}`;
}

// Dev admin credential loaded from environment variable only — no plaintext password in code
const DEV_ADMIN_CREDENTIAL =
  process.env.NODE_ENV === "development" && process.env.DEV_ADMIN_PASSWORD
    ? {
        email: "info@blockmec.org",
        password: process.env.DEV_ADMIN_PASSWORD,
        role: UserRole.admin,
      }
    : null;

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, {
      maxRequests: 5,
      windowMs: 60000, // 1 minute
    });

    if (rateLimitResult) return rateLimitResult;

    const body = await req.json().catch(() => ({}));
    const parsed = signInSchema.safeParse(body as unknown);
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error);
      return NextResponse.json({ error: flat }, { status: 400 });
    }
    const input = parsed.data as SignInInput;

    // Development mode authentication (when Supabase is not configured)
    if (
      !hasSupabaseEnv() &&
      process.env.NODE_ENV === "development" &&
      DEV_ADMIN_CREDENTIAL
    ) {
      if (
        input.email === DEV_ADMIN_CREDENTIAL.email &&
        input.password === DEV_ADMIN_CREDENTIAL.password
      ) {
        let user = await prisma.user.findUnique({
          where: { email: input.email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: input.email,
              name: input.email.split("@")[0],
              role: UserRole.admin,
              supabase_id: generateDevUUID(),
              email_verified: true,
            },
          });
        }

        if (user.role !== UserRole.admin) {
          return NextResponse.json(
            { error: "Admin access required" },
            { status: 403 },
          );
        }

        const publicUser: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
        return NextResponse.json({
          user: publicUser,
          message: "Admin logged in successfully",
        });
      }

      return NextResponse.json(
        { error: "Invalid credentials or insufficient permissions" },
        { status: 401 },
      );
    }

    // Production authentication via Supabase
    const supabase = await createOptionalServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Authentication service not configured" },
        { status: 503 },
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data?.session) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const supabaseUser = data.user;
    if (!supabaseUser?.id) {
      return NextResponse.json(
        { error: "No user returned from auth provider" },
        { status: 500 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { supabase_id: supabaseUser.id },
    });

    if (!user || user.role !== UserRole.admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const publicUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return NextResponse.json({
      user: publicUser,
      message: "Admin logged in successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
