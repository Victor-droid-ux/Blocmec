// app/api/auth/signout/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  createOptionalServerSupabaseClient,
  hasSupabaseEnv,
} from "@/lib/supabase/server";

export async function POST(_req: NextRequest) {
  try {
    // In dev mode without Supabase configured there are no server-side cookies
    // to clear. The client handles Redux state cleanup on its own.
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ ok: true, message: "Signed out" });
    }

    const supabase = await createOptionalServerSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    return NextResponse.json({ ok: true, message: "Signed out" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sign out failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
