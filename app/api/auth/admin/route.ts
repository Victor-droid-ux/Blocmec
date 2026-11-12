import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { signInSchema, type SignInInput } from "@/lib/validation";
import { rateLimit } from "@/lib/rateLimiter";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/cookies";
import { User } from "@/types/store/user";
import { UserRole } from "@/prisma/generated/enums";

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
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.role !== UserRole.admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    if (!user.password_hash) {
      return NextResponse.json(
        { error: "Invalid credentials or insufficient permissions" },
        { status: 401 },
      );
    }

    const isValid = await verifyPassword(input.password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials or insufficient permissions" },
        { status: 401 },
      );
    }

    const publicUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const response = NextResponse.json({
      user: publicUser,
      message: "Admin logged in successfully",
    });

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
