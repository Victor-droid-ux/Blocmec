import { NextRequest, NextResponse } from "next/server";
import { createOptionalServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const code =
      typeof body?.code === "string" && body.code.trim().length > 0
        ? body.code.trim()
        : null;

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 },
      );
    }

    const supabase = await createOptionalServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Authentication service not configured" },
        { status: 503 },
      );
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to complete verification from this link. Please request a new link.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to exchange auth code" },
      { status: 500 },
    );
  }
}
