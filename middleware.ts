import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Enhanced public paths list - these don't require authentication
  const isPublicPath =
    pathname === "/login" ||
    pathname === "/" || // Allow home page as public
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/debug-session") || // Allow debug route
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".");

  // Skip middleware for public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  try {
    // Get the token with debug info
    console.log(`[Middleware] Checking auth for: ${pathname}`);

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    console.log(`[Middleware] Token exists: ${!!token}`);

    // If not authenticated, redirect to login
    if (!token) {
      console.log(`[Middleware] No token, redirecting to login`);
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // Log the token info without sensitive data
    console.log(
      `[Middleware] User authenticated: ${token.name}, role: ${token.role}`
    );

    // Admin-only paths check
    const isAdminPath = pathname.startsWith("/admin");
    if (isAdminPath && token.role !== "admin") {
      console.log(
        `[Middleware] Access denied to admin area for user with role: ${token.role}`
      );
      return NextResponse.redirect(new URL("/", request.url));
    }

    // User is authenticated and authorized
    return NextResponse.next();
  } catch (error) {
    console.error("[Middleware] Auth error:", error);

    // In case of error, allow access to prevent breaking the app
    // You might want to change this in production
    return NextResponse.next();
  }
}

// Updated matcher pattern to avoid processing auth and static routes
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api/auth routes (NextAuth)
     * 2. /_next (static files)
     * 3. /favicon.ico, /sitemap.xml, etc. (static files)
     * 4. /login (public route)
     */
    "/((?!api/auth|_next|login|.*\\.).*)",
  ],
};
