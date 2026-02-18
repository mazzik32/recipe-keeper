"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Heart,
  Camera,
  FolderOpen,
  Plus,
  Settings,
  Menu,
  X,
  Tag,
  Library,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { localeNames, type Locale } from "@/lib/i18n";
import { AddRecipeButton } from "@/components/layout/AddRecipeButton";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  key: keyof typeof import("@/lib/i18n/translations/en").en.nav;
  href: string;
  icon: LucideIcon;
}

const navigation: NavItem[] = [
  { key: "myRecipes", href: "/dashboard", icon: Home },
  { key: "categories", href: "/dashboard/categories", icon: FolderOpen },
  { key: "tags", href: "/dashboard/tags", icon: Tag },
  { key: "collections", href: "/dashboard/collections", icon: Library },
  { key: "favorites", href: "/dashboard/favorites", icon: Heart },
  { key: "recipeBook", href: "/dashboard/recipe-book", icon: BookOpen },
  { key: "settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { locale, setLocale, t } = useLanguage();

  return (
    <>
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="w-6 h-6 text-warm-gray-600" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-72 pt-[env(safe-area-inset-top)] bg-warm-white z-50 transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-warm-gray-100">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <span className="text-2xl">🍳</span>
            <span className="font-display text-xl text-warm-gray-700">
              {t.common.appName}
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5 text-warm-gray-500" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {/* Add Recipe Button */}
          <AddRecipeButton onSelect={() => setIsOpen(false)} />

          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-warm-gray-500 hover:bg-peach-50 hover:text-peach-600 transition-colors",
                  isActive && "bg-peach-100 text-peach-700"
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{t.nav[item.key]}</span>
              </Link>
            );
          })}
        </nav>

        {/* Language Selector (Mobile) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-warm-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-warm-gray-500" />
            <span className="text-sm text-warm-gray-500">{t.settings.language}</span>
          </div>
          <div className="flex gap-2">
            {(Object.keys(localeNames) as Locale[]).map((loc) => (
              <Button
                key={loc}
                variant={locale === loc ? "default" : "outline"}
                size="sm"
                onClick={() => setLocale(loc)}
                className={cn(
                  "flex-1",
                  locale === loc
                    ? "bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
                    : "border-warm-gray-200"
                )}
              >
                {loc === "en" ? "🇬🇧" : "🇩🇪"} {localeNames[loc]}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
