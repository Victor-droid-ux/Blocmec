// app/api/auth/signout/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/auth/cookies";

export async function POST(_req: NextRequest) {
  try {
    const response = NextResponse.json({ ok: true, message: "Signed out" });
    clearSessionCookie(response);
    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sign out failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
