import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rateLimiter";
import { createOptionalServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.email({ message: "Invalid email address" }),
});

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, {
      maxRequests: 3,
      windowMs: 5 * 60 * 1000,
    });

    if (limited) {
      return limited;
    }

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();

    const supabase = await createOptionalServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Authentication service not configured" },
        { status: 503 },
      );
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${req.nextUrl.origin}/auth/callback`,
      },
    });

    if (error) {
      console.warn("[Auth/ResendVerification] Supabase resend failed", {
        message: error.message,
        code: (error as { status?: number }).status,
      });

      return NextResponse.json(
        {
          success: true,
          message:
            "If an account exists, a verification email will be sent when allowed by provider limits. Please check your inbox and try again shortly.",
          cooldownSeconds: 60,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists, we have sent a new verification email. Please check your inbox.",
      cooldownSeconds: 60,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to resend verification email" },
      { status: 500 },
    );
  }
}
