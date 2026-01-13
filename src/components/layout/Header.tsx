"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, LogOut, User, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { localeNames, type Locale } from "@/lib/i18n";

interface HeaderProps {
  user: {
    email?: string;
    displayName?: string;
  };
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const { locale, setLocale, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.[0].toUpperCase() || "U";

  return (
    <header className="h-16 bg-warm-white border-b border-warm-gray-100 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Mobile Nav */}
      <MobileNav />

      {/* Mobile Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 md:hidden"
      >
        <span className="text-xl">🍳</span>
        <span className="font-display text-lg text-warm-gray-700">
          {t.common.appName}
        </span>
      </Link>

      {/* Search */}
      <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray-400" />
          <Input
            type="search"
            placeholder={t.recipes.searchRecipes}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-warm-gray-200 focus:ring-peach-300 bg-warm-gray-50"
          />
        </div>
      </form>

      <div className="flex items-center gap-2">
        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-10 w-10 hover:bg-peach-50"
            >
              <Globe className="h-5 w-5 text-warm-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(localeNames) as Locale[]).map((loc) => (
              <DropdownMenuItem
                key={loc}
                onClick={() => setLocale(loc)}
                className={`cursor-pointer ${locale === loc ? "bg-peach-50 text-peach-700" : ""}`}
              >
                <span className="mr-2">{loc === "en" ? "🇬🇧" : "🇩🇪"}</span>
                {localeNames[loc]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full hover:bg-peach-50"
            >
              <Avatar className="h-10 w-10 border-2 border-peach-200">
                <AvatarFallback className="bg-peach-100 text-peach-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-warm-gray-700">
                {user.displayName || "User"}
              </p>
              <p className="text-xs text-warm-gray-500">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings")}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              <span>{t.nav.settings}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t.auth.logout}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
