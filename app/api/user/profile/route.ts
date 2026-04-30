//app/api/user/profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateProfileSchema, publicProfileSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rateLimiter";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: supUser },
      error: supError,
    } = await supabase.auth.getUser();

    if (supError || !supUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { supabase_id: supUser.id },
    });
    if (!user && supUser.email) {
      user = await prisma.user.findUnique({ where: { email: supUser.email } });
    }

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const publicUser = {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      role: user.role,
      subscription_plan: user.subscription_plan ?? null,
      api_credits: user.api_credits ?? 0,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at?.toISOString(),
    };

    publicProfileSchema.parse(publicUser);

    return NextResponse.json({ user: publicUser });
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

    const body = await req.json().catch(() => ({}));

    const parsed = updateProfileSchema.safeParse(body as unknown);
    if (!parsed.success) {
      const flat = z.flattenError
        ? z.flattenError(parsed.error)
        : parsed.error.flatten();
      return NextResponse.json({ error: flat }, { status: 400 });
    }
    const input = parsed.data;

    const supabase = await createServerSupabaseClient();
    const {
      data: { user: supUser },
      error: supError,
    } = await supabase.auth.getUser();

    if (supError || !supUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { supabase_id: supUser.id },
    });
    if (!user && supUser.email) {
      user = await prisma.user.findUnique({ where: { email: supUser.email } });
    }
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Only `name` is currently supported.
    // To add phone, location, department, bio:
    // 1. Add the columns to prisma/schema/users.prisma
    // 2. Run `npx prisma migrate dev`
    // 3. Add them to updateProfileSchema in lib/validation.ts
    // 4. Uncomment the relevant lines below
    const dataToUpdate: Record<string, any> = {};
    if (typeof input.name !== "undefined") dataToUpdate.name = input.name;
    // if (typeof input.phone !== "undefined") dataToUpdate.phone = input.phone;
    // if (typeof input.location !== "undefined") dataToUpdate.location = input.location;
    // if (typeof input.department !== "undefined") dataToUpdate.department = input.department;
    // if (typeof input.bio !== "undefined") dataToUpdate.bio = input.bio;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { ...dataToUpdate, updated_at: new Date() },
    });

    const publicUser = {
      id: updated.id,
      email: updated.email,
      name: updated.name ?? null,
      role: updated.role,
      subscription_plan: updated.subscription_plan ?? null,
      api_credits: updated.api_credits ?? 0,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at?.toISOString(),
    };

    publicProfileSchema.parse(publicUser);

    return NextResponse.json({ user: publicUser });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
