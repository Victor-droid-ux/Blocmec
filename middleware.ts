import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIXES = ["/dashboard", "/admin-panel"];

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

export async function middleware(request: NextRequest) {
  const config = getSupabaseConfig();
  const { pathname } = request.nextUrl;

  const requiresSession = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  // Without auth configured, let the app render its own configuration errors
  // instead of locking everyone out.
  if (!config) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Always refresh the session so server components see a valid user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!requiresSession) {
    return response;
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin areas also require the admin role. The role is mirrored into the
  // Supabase app_metadata when an admin creates the account.
  if (
    pathname === "/admin-panel" ||
    pathname.startsWith("/admin-panel/")
  ) {
    const role = (user.app_metadata as { role?: string } | null)?.role;
    if (role && role !== "admin") {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Refresh sessions on app routes, but skip static assets and the public
     * script endpoint (it is fetched from customer websites).
     */
    "/((?!_next/static|_next/image|favicon.ico|images|api/script|api/verify-qr).*)",
  ],
};
