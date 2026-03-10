import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkApiRateLimit } from "@/lib/rate-limit";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const isAdminHost = host.includes('admin.recipekeeper.org');

  if (isAdminHost && path === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.rewrite(url);
  }

  if (
    path.startsWith('/api/stripe/webhook') ||
    path.startsWith('/api/paddle/webhook') ||
    path.startsWith('/auth/callback')
  ) {
    return NextResponse.next();
  }

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

  if (request.nextUrl.pathname.startsWith("/api") || request.nextUrl.pathname.startsWith("/supabase")) {
    if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
      const origin = request.headers.get("origin");
      const referer = request.headers.get("referer");
      const allowedOrigin = request.nextUrl.origin;

      if (origin && !origin.startsWith(allowedOrigin)) {
         return new NextResponse("Forbidden: Invalid Origin", { status: 403 });
      }

      if (referer && !referer.startsWith(allowedOrigin)) {
         return new NextResponse("Forbidden: Invalid Referer", { status: 403 });
      }
    }
  }

  const response = await updateSession(request);

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhooks).*)",
  ],
};
