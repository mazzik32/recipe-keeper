import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

// Rate limit tiers
// Auth: 5 requests per 60 seconds per IP
export const AUTH_RATE_LIMIT = { maxRequests: 5, windowSeconds: 60 };
// API: 20 requests per 60 seconds per IP
export const API_RATE_LIMIT = { maxRequests: 20, windowSeconds: 60 };

/**
 * Enforces a rate limit for a specific route group and IP.
 * Returns true if the request is allowed, false if the limit is exceeded.
 */
export async function checkApiRateLimit(
  ip: string,
  routeGroup: 'auth' | 'api'
): Promise<boolean> {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
           // Read-only in this context
        }
      }
    }
  );

  const limits = routeGroup === 'auth' ? AUTH_RATE_LIMIT : API_RATE_LIMIT;

  // Use the RPC function created in migration 00010
  // @ts-ignore - The generated types might not have check_rate_limit yet
  const { data: isAllowed, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: ip,
    p_route_group: routeGroup,
    p_max_requests: limits.maxRequests,
    p_window_seconds: limits.windowSeconds,
  } as any);

  if (error) {
    console.error('Rate limit RPC error:', error);
    // Fail open if the database call fails, to prevent locking out all users during DB issues
    return true; 
  }

  return isAllowed === true;
}
