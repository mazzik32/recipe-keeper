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
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SignupPage() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [captchaToken, setCaptchaToken] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupInput) {
    setIsLoading(true);
    setError(null);

    if (!captchaToken) {
      setError("Please complete the CAPTCHA by verifying you are human.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          displayName: data.displayName,
          turnstileToken: captchaToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "An error occurred during signup.");
        turnstileRef.current?.reset();
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      turnstileRef.current?.reset();
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md border-warm-gray-200 shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl text-warm-gray-700">
            {locale === "de" ? "E-Mail bestätigen" : "Check your email"}
          </CardTitle>
          <CardDescription className="text-warm-gray-500">
            {locale === "de"
              ? "Wir haben Ihnen einen Bestätigungslink gesendet."
              : "We have sent you a confirmation link."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-warm-gray-600">
            {locale === "de"
              ? "Bitte überprüfen Sie Ihren Posteingang (und Spam-Ordner) und klicken Sie auf den Link, um Ihr Konto zu aktivieren."
              : "Please check your inbox (and spam folder) and click the link to activate your account."}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            onClick={() => router.push('/login')}
            variant="outline"
            className="w-full border-peach-200 text-peach-700 hover:bg-peach-50"
          >
            {locale === "de" ? "Zurück zum Login" : "Back to Login"}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-warm-gray-200 shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-2xl text-warm-gray-700">
          {locale === "de" ? "Konto erstellen" : "Create your account"}
        </CardTitle>
        <CardDescription className="text-warm-gray-500">
          {locale === "de"
            ? "Beginnen Sie noch heute, Ihre Familienrezepte zu bewahren"
            : "Start preserving your family recipes today"}
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
            <Label htmlFor="displayName" className="text-warm-gray-600">
              {t.settings.displayName}
            </Label>
            <Input
              id="displayName"
              type="text"
              placeholder={locale === "de" ? "Max Mustermann" : "John Doe"}
              {...register("displayName")}
              className="border-warm-gray-200 focus:ring-peach-300"
            />
            {errors.displayName && (
              <p className="text-sm text-red-500">{errors.displayName.message}</p>
            )}
          </div>
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
            <Label htmlFor="password" className="text-warm-gray-600">
              {t.auth.password}
            </Label>
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
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
              onSuccess={(token) => setCaptchaToken(token)}
              onError={() => setError("CAPTCHA error. Please try again.")}
              onExpire={() => setCaptchaToken("")}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {locale === "de" ? "Konto erstellen" : "Create account"}
          </Button>
          <p className="text-sm text-warm-gray-500 text-center">
            {t.auth.hasAccount}{" "}
            <Link href="/login" className="text-peach-600 hover:underline">
              {t.auth.login}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
