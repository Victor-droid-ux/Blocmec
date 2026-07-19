import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createOptionalServerSupabaseClient } from "@/lib/supabase/server";
import { UserRole } from "@/prisma/generated/enums";

function deriveDisplayName(user: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
}) {
  const metadata = user.user_metadata ?? {};
  const fromMeta =
    (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    null;

  if (fromMeta) {
    return fromMeta;
  }

  if (user.email) {
    return user.email.split("@")[0] ?? null;
  }

  return null;
}

export async function POST() {
  try {
    const supabase = await createOptionalServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Authentication service not configured" },
        { status: 503 },
      );
    }

    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !supabaseUser?.id || !supabaseUser.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const normalizedEmail = supabaseUser.email.trim().toLowerCase();
    const emailVerified = Boolean(supabaseUser.email_confirmed_at);

    const dbUser = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        supabase_id: supabaseUser.id,
        email: normalizedEmail,
        email_verified: emailVerified,
        name: deriveDisplayName(supabaseUser),
        updated_at: new Date(),
      },
      create: {
        email: normalizedEmail,
        supabase_id: supabaseUser.id,
        email_verified: emailVerified,
        role: UserRole.user,
        name: deriveDisplayName(supabaseUser),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({ user: dbUser });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to sync authenticated user" },
      { status: 500 },
    );
  }
}
