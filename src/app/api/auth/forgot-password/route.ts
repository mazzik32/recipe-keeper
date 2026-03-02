import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, turnstileToken, origin } = await request.json();

    if (!email || !turnstileToken) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Verify Turnstile Token
    const formData = new FormData();
    formData.append("secret", process.env.TURNSTILE_SECRET_KEY!);
    formData.append("response", turnstileToken);

    const verifyResult = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        body: formData,
        method: "POST",
      }
    );

    const outcome = await verifyResult.json();

    if (!outcome.success) {
      return NextResponse.json(
        { error: "CAPTCHA verification failed. Please try again." },
        { status: 400 }
      );
    }

    // If valid, authenticate with Supabase Server Client
    const supabase = await createClient();
    
    // Use the origin passed from the client, or fallback to request url
    const requestOrigin = origin || new URL(request.url).origin;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${requestOrigin}/reset-password`,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Forgot Password Proxy Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
