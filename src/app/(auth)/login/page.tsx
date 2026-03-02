"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [captchaToken, setCaptchaToken] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    setError(null);

    if (!captchaToken) {
      setError("Please complete the CAPTCHA by verifying you are human.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          turnstileToken: captchaToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "An error occurred during login.");
        turnstileRef.current?.reset();
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      turnstileRef.current?.reset();
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-warm-gray-200 shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-2xl text-warm-gray-700">
          {t.auth.welcomeBack}
        </CardTitle>
        <CardDescription className="text-warm-gray-500">
          {t.auth.signInDescription}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-warm-gray-600">
              {t.auth.email}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              className="border-warm-gray-200 focus:ring-peach-300"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-warm-gray-600">
                {t.auth.password}
              </Label>
              <Link
                href="/forgot-password"
                className="text-sm text-peach-600 hover:underline"
              >
                {t.auth.forgotPassword}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className="border-warm-gray-200 focus:ring-peach-300"
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <div className="flex justify-center pt-2">
            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setCaptchaToken(token)}
                onError={() => setError("CAPTCHA error. Please try again.")}
                onExpire={() => setCaptchaToken("")}
              />
            )}
            {!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <p className="text-sm text-red-500">CAPTCHA configuration missing.</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.auth.login}
          </Button>
          <p className="text-sm text-warm-gray-500 text-center">
            {t.auth.noAccount}{" "}
            <Link href="/signup" className="text-peach-600 hover:underline">
              {t.auth.signup}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
