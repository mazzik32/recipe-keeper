import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Verify custom API secret to prevent direct endpoint abuse
    const requestSecret = req.headers.get('x-app-secret');
    const expectedSecret = Deno.env.get('APP_API_SECRET');

    console.log("RECEIVED SECRET:", requestSecret);
    console.log("EXPECTED SECRET:", expectedSecret);

    if (!expectedSecret || requestSecret !== expectedSecret) {
        console.warn("Unauthorized request attempt (invalid or missing x-app-secret)");
        return new Response(JSON.stringify({ error: "Unauthorized app client" }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') || '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        );
        const nowIso = new Date().toISOString();

        // Get the client's IP address (typically in x-forwarded-for when behind Cloudflare/Supabase proxy)
        const ip = req.headers.get('x-forwarded-for') || "unknown";

        if (ip === "unknown") {
            return new Response(JSON.stringify({ error: "Could not determine IP address" }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Call the database RPC function to increment. It returns true if under limit (max 3), false if over.
        const { data: allowed, error: rpcError } = await supabaseAdmin.rpc('increment_anonymous_ip_count', {
            client_ip: ip
        });

        if (rpcError) {
            console.error("RPC Error:", rpcError);
            return new Response(JSON.stringify({ error: "Internal Server Error" }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (!allowed) {
            // Rate limit exceeded
            return new Response(JSON.stringify({ error: "Anonymous account limit reached for this network (Max 3). Please create an account to continue." }), {
                status: 429,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // If allowed, use the regular ANON client to sign in anonymously.
        // This generates a full Supabase session (access_token, refresh_token, user)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const { data: authData, error: authError } = await supabaseClient.auth.signInAnonymously();

        if (authData?.user?.id) {
            await supabaseAdmin.from('analytics_events').insert({
                event_name: 'anonymous_session_created',
                user_id: authData.user.id,
                user_type_snapshot: 'anonymous',
                channel: 'mobile',
                event_key: authData.user.id,
                occurred_at: nowIso,
                metadata: {
                    ip,
                },
            });
        }

        if (authError || !authData.session) {
            console.error("Auth Error:", authError);
            return new Response(JSON.stringify({ error: "Failed to create anonymous session. Please ensure Anonymous Sign-In is enabled in Supabase Authentication Providers." }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Return the full session object to the mobile app
        return new Response(JSON.stringify({ 
             session: authData.session,
             user: authData.user
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err) {
        return new Response(String(err?.message ?? err), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-anonymous-session' \
    --header 'Authorization: Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjIwODc3Mzg2OTB9.xl_lLm1sjzPo1_JBSFhn6-uD1NE9oV5XpgAh0qzL3FEK6BtU0EirwkKFuHKXj2fOiDea8_Z0HM02M_Ul_ZQatA' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
