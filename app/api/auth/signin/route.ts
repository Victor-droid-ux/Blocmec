import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimiter";
import {
  createOptionalServerSupabaseClient,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import { UserRole } from "@/prisma/generated/enums";
import { signInSchema, type SignInInput } from "@/lib/validation";
import { User } from "@/types/store/user";

function generateDevUUID() {
  return `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, "0")}`;
}

// Dev credentials loaded from environment variables only — no plaintext passwords in code
const DEV_CREDENTIALS: Record<
  string,
  { password: string; role: UserRole }
> | null =
  process.env.NODE_ENV === "development" &&
  process.env.DEV_USER_PASSWORD &&
  process.env.DEV_ADMIN_PASSWORD &&
  process.env.DEV_DEVELOPER_PASSWORD
    ? {
        "user@blockmec.org": {
          password: process.env.DEV_USER_PASSWORD,
          role: UserRole.user,
        },
        "info@blockmec.org": {
          password: process.env.DEV_ADMIN_PASSWORD,
          role: UserRole.admin,
        },
        "developer@blockmec.org": {
          password: process.env.DEV_DEVELOPER_PASSWORD,
          role: UserRole.developer,
        },
      }
    : null;

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, {
      maxRequests: 5,
      windowMs: 60000,
    });
    if (rateLimitResult) return rateLimitResult;

    const body = await req.json().catch(() => ({}));
    const parsed = signInSchema.safeParse(body as unknown);
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error);
      return NextResponse.json({ error: flat }, { status: 400 });
    }
    const input = parsed.data as SignInInput;

    // Development mode — only active when Supabase is not configured AND dev passwords are set
    if (
      !hasSupabaseEnv() &&
      process.env.NODE_ENV === "development" &&
      DEV_CREDENTIALS
    ) {
      const devCreds = DEV_CREDENTIALS[input.email];
      if (devCreds && devCreds.password === input.password) {
        let user = await prisma.user.findUnique({
          where: { email: input.email },
        });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: input.email,
              name: input.email.split("@")[0],
              role: devCreds.role,
              supabase_id: generateDevUUID(),
              email_verified: true,
            },
          });
        }
        const publicUser: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
        return NextResponse.json({ user: publicUser });
      }
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Production via Supabase
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

    const user = await prisma.user.upsert({
      where: { email: input.email },
      update: { supabase_id: supabaseUser.id, updated_at: new Date() },
      create: {
        email: input.email,
        supabase_id: supabaseUser.id,
        role: UserRole.user,
      },
    });

    const publicUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return NextResponse.json({ user: publicUser });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
