import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // Security Checks for API routes
  if (request.nextUrl.pathname.startsWith("/api") || request.nextUrl.pathname.startsWith("/supabase")) {
    // 1. Origin Check for MUTATING requests (POST, PUT, DELETE, PATCH)
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

  const response = await updateSession(request);

  // Security Headers
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
