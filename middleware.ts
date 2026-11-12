import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/jwt";

const PROTECTED_PREFIXES = ["/dashboard", "/admin-panel"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requiresSession = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!requiresSession) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/admin-panel" || pathname.startsWith("/admin-panel/")) {
    if (session.role !== "admin") {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
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
