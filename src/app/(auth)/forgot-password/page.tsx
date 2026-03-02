"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordData) {
    setIsLoading(true);
    setError(null);

    if (!captchaToken) {
      setError("Please complete the CAPTCHA by verifying you are human.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          turnstileToken: captchaToken,
          origin: window.location.origin,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "An error occurred submitting the request.");
        turnstileRef.current?.reset();
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      turnstileRef.current?.reset();
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md border-warm-gray-100">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-peach-100 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-peach-600" />
          </div>
          <CardTitle className="font-display text-2xl text-warm-gray-700">
            {t.auth.checkEmail}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-warm-gray-500">
            {t.auth.resetEmailSent}
          </p>
          <Link href="/login">
            <Button
              variant="outline"
              className="border-peach-300 text-peach-700 hover:bg-peach-50"
            >
              {t.auth.backToLogin}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-warm-gray-100">
      <CardHeader>
        <Link
          href="/login"
          className="inline-flex items-center text-warm-gray-500 hover:text-warm-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.auth.backToLogin}
        </Link>
        <CardTitle className="font-display text-2xl text-warm-gray-700">
          {t.auth.resetPassword}
        </CardTitle>
        <p className="text-warm-gray-500 text-sm">
          {t.auth.email}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="your@email.com"
              className="border-warm-gray-200"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="flex justify-center pt-2 pb-2">
            {TURNSTILE_SITE_KEY ? (
              <Turnstile
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={(token) => setCaptchaToken(token)}
                onError={() => setError("CAPTCHA error. Please try again.")}
                onExpire={() => setCaptchaToken("")}
              />
            ) : (
              <p className="text-sm text-red-500">CAPTCHA configuration missing.</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.auth.sendResetLink}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
