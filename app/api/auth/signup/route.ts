import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimiter";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/cookies";
import { UserRole } from "@/prisma/generated/enums";
import { signUpSchema, type SignUpInput } from "@/lib/validation";
import { User } from "@/types/store/user";

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

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const password_hash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        name: displayName,
        username: companyName ?? displayName,
        role: UserRole.user,
        email_verified: true,
      },
    });

    const publicUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const response = NextResponse.json(
      {
        user: publicUser,
        signedIn: true,
        requiresEmailVerification: false,
        message: "Account created successfully",
      },
      { status: 201 },
    );

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
