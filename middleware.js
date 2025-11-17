import { NextResponse } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/setup",
  "/unauthorized",
  "/guest",
  "/guest/assets",
  "/api/guest",
  "/select-org",
];

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/admin",
  "/assets",
  "/requests",
  "/dashboard",
  "/api/notifications",
];

// Admin-only routes
const ADMIN_ROUTES = ["/admin"];

const ORG_REQUIRED_ROUTES = [
  "/dashboard",
  "/admin",
  "/assets",
  "/consumables",
  "/requests",
  "/api",
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Allow API routes, static files, and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".") ||
    pathname.startsWith("/api/guest")
  ) {
    return response;
  }

  // Get session cookie (Appwrite session) - check multiple possible cookie names
  // Modern Appwrite uses pattern: a_session_<PROJECT_ID>
  // Note: Appwrite stores sessions in localStorage, not cookies, so middleware can't detect them
  // We'll be lenient and allow access - client-side LayoutProvider will handle auth checks
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const modernSessionCookie = request.cookies.get(`a_session_${projectId}`);
  const legacySessionCookie = request.cookies.get(
    `a_session_${projectId}_legacy`
  );

  // Fallback checks for older patterns (for compatibility)
  const legacySession = request.cookies.get("a_session_console_legacy");
  const consoleSession = request.cookies.get("a_session_console");
  const standardSession = request.cookies.get("a_session");

  // Priority order: modern pattern first, then legacy patterns
  const session =
    modernSessionCookie ||
    legacySessionCookie ||
    legacySession ||
    consoleSession ||
    standardSession;

  // Since Appwrite uses localStorage, we can't reliably detect sessions in middleware
  // Allow all routes through - LayoutProvider will handle authentication client-side
  // Only block if we have a clear session cookie (for server-side detection)
  const isAuthenticated = !!session;
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  const orgCookie = request.cookies.get("currentOrgCode");

  // Handle root redirect
  if (pathname === "/") {
    if (isAuthenticated) {
      if (!orgCookie?.value) {
        const selectUrl = new URL("/select-org", request.url);
        selectUrl.searchParams.set("callback", "/dashboard");
        return NextResponse.redirect(selectUrl);
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Prevent authenticated users from accessing login page
  if (pathname === "/login" && isAuthenticated) {
    if (!orgCookie?.value) {
      const selectUrl = new URL("/select-org", request.url);
      selectUrl.searchParams.set("callback", "/dashboard");
      return NextResponse.redirect(selectUrl);
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Don't redirect unauthenticated users in middleware
  // Appwrite sessions are in localStorage, so middleware can't detect them
  // Let LayoutProvider handle authentication checks client-side
  // This prevents false redirects right after login
  // if (!isAuthenticated && isProtectedRoute) {
  //   const loginUrl = new URL("/login", request.url);
  //   if (pathname !== "/login") {
  //     loginUrl.searchParams.set("callback", pathname + request.nextUrl.search);
  //   }
  //   return NextResponse.redirect(loginUrl);
  // }

  if (
    isAuthenticated &&
    !orgCookie?.value &&
    pathname !== "/select-org" &&
    ORG_REQUIRED_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    const selectUrl = new URL("/select-org", request.url);
    selectUrl.searchParams.set(
      "callback",
      pathname + request.nextUrl.search
    );
    return NextResponse.redirect(selectUrl);
  }

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
