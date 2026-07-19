import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function resolveSafeNextPath(nextPath: string | null) {
  if (!nextPath) return null;

  const trimmed = nextPath.trim();
  const isDashboardPath = /^\/dashboard(?:\/.*)?$/.test(trimmed);

  if (
    !isDashboardPath ||
    trimmed.includes("://") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\")
  ) {
    return null;
  }

  return trimmed;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const safeNext = resolveSafeNextPath(requestUrl.searchParams.get("next"));
  const successTarget = safeNext ?? "/dashboard";
  const failureTarget = "/?auth_callback=failed";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(failureTarget, request.url));
    }

    return NextResponse.redirect(new URL(successTarget, request.url));
  }

  return NextResponse.redirect(new URL(failureTarget, request.url));
}
