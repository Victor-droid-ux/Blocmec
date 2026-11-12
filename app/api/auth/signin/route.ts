import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimiter";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/cookies";
import { signInSchema, type SignInInput } from "@/lib/validation";
import { User } from "@/types/store/user";

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

    // Determine if input is email or username
    const isEmail = input.email.includes("@");
    const normalizedInput = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: isEmail
        ? { email: normalizedInput }
        : { username: normalizedInput },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "No account was found. Please check your email/username and try again.",
          code: "user_not_found",
        },
        { status: 404 },
      );
    }

    if (!user.password_hash) {
      return NextResponse.json(
        {
          error: "This account has no password set. Please contact support.",
          code: "no_password",
        },
        { status: 401 },
      );
    }

    const isValid = await verifyPassword(input.password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        {
          error: "The password you entered is incorrect. Please try again.",
          code: "incorrect_password",
        },
        { status: 401 },
      );
    }

    const publicUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const response = NextResponse.json({ user: publicUser });
    await setSessionCookie(response, {
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
