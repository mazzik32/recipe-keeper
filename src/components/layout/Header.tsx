"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, LogOut, User, Globe, Coins, Plus, X } from "lucide-react";
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
import { PricingModal } from "@/components/monetization/PricingModal";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HeaderProps {
  user: {
    email?: string;
    displayName?: string;
    credits?: number;
    id?: string;
  };
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const { locale, setLocale, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
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
    <>
      <header className="h-14 md:h-16 bg-warm-white border-b border-warm-gray-100 px-3 md:px-6 flex items-center gap-2 md:gap-4">
        {/* Desktop: Hamburger Nav */}
        <div className="hidden md:block shrink-0">
          <MobileNav />
        </div>

        {/* Mobile: Just logo icon */}
        <Link href="/dashboard" className="md:hidden shrink-0">
          <Image
            src="/assets/logo.png"
            alt="RecipeKeeper"
            width={28}
            height={28}
            className="w-7 h-7 object-contain"
          />
        </Link>

        {/* Spacer / Desktop search */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSearch} className="hidden md:block max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray-400" />
              <Input
                type="search"
                placeholder={t.recipes.searchRecipes}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-warm-gray-200 focus:ring-peach-300 bg-warm-gray-50 w-full"
              />
            </div>
          </form>
        </div>

        {/* Right side controls - always visible */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Mobile: Search button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 hover:bg-peach-50"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5 text-warm-gray-500" />
          </Button>

          {/* Credits badge - visible on all sizes */}
          <Badge
            variant="outline"
            className="h-7 px-2 gap-1 bg-white border-warm-gray-200 cursor-pointer hover:bg-peach-50"
            onClick={() => setIsPricingOpen(true)}
          >
            <Coins className="w-3 h-3 text-peach-500" />
            <span className="font-medium text-xs text-warm-gray-700">{user.credits ?? 0}</span>
          </Badge>

          {/* Desktop: Add credits button */}
          <Button
            size="sm"
            variant="ghost"
            className="hidden md:flex h-8 w-8 p-0 rounded-full hover:bg-peach-50 text-peach-600"
            onClick={() => setIsPricingOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* Desktop: Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex h-9 w-9 hover:bg-peach-50"
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
                className="relative h-8 w-8 rounded-full hover:bg-peach-50 p-0"
              >
                <Avatar className="h-8 w-8 border-2 border-peach-200">
                  <AvatarFallback className="bg-peach-100 text-peach-700 text-xs">
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

      <PricingModal open={isPricingOpen} onOpenChange={setIsPricingOpen} />

      {/* Mobile Search Modal */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.recipes.searchRecipes}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch} className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray-400" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder={t.recipes.searchRecipes}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 border-warm-gray-200 focus:ring-peach-300 bg-warm-gray-50"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4 text-warm-gray-400" />
                </Button>
              )}
            </div>
            <Button
              type="submit"
              className="w-full mt-4 bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
              disabled={!searchQuery.trim()}
            >
              {t.recipes.searchRecipes}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
