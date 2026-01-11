"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          display_name: data.displayName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md border-warm-gray-200 shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-2xl text-warm-gray-700">
          Create your account
        </CardTitle>
        <CardDescription className="text-warm-gray-500">
          Start preserving your family recipes today
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
              Your name
            </Label>
            <Input
              id="displayName"
              type="text"
              placeholder="John Doe"
              {...register("displayName")}
              className="border-warm-gray-200 focus:ring-peach-300"
            />
            {errors.displayName && (
              <p className="text-sm text-red-500">{errors.displayName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-warm-gray-600">
              Email
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
              Password
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
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
          <p className="text-sm text-warm-gray-500 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-peach-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
