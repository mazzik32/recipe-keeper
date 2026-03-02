import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkApiRateLimit } from "@/lib/rate-limit";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Skip rate limiting and session updates for webhooks and oauth callbacks
  if (
    path.startsWith('/api/stripe/webhook') ||
    path.startsWith('/api/paddle/webhook') ||
    path.startsWith('/auth/callback')
  ) {
    return NextResponse.next();
  }

  // 2. Apply Rate Limiting for all other /api/* routes
  if (path.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const isAuthRoute = path.startsWith('/api/auth/');
    const routeGroup = isAuthRoute ? 'auth' : 'api';

    const isAllowed = await checkApiRateLimit(ip, routeGroup);

    if (!isAllowed) {
      console.warn(`Rate limit exceeded for IP: ${ip} on route group: ${routeGroup}`);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: { 'Retry-After': '60' }
        }
      );
    }
  }

  // 3. Security Checks for API routes
  if (request.nextUrl.pathname.startsWith("/api") || request.nextUrl.pathname.startsWith("/supabase")) {
    // Origin Check for MUTATING requests (POST, PUT, DELETE, PATCH)
    if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
      const origin = request.headers.get("origin");
      const referer = request.headers.get("referer");
      const allowedOrigin = request.nextUrl.origin;
      
      // If origin is present, it must match.
      if (origin && !origin.startsWith(allowedOrigin)) {
         return new NextResponse("Forbidden: Invalid Origin", { status: 403 });
      }
      
      // If referer is present, it must match.
      if (referer && !referer.startsWith(allowedOrigin)) {
         return new NextResponse("Forbidden: Invalid Referer", { status: 403 });
      }
    }
  }

  // 4. Update Supabase Session & Handle Page Redirects
  const response = await updateSession(request);

  // 5. Security Headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api/webhooks (public webhooks)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhooks).*)",
  ],
};
