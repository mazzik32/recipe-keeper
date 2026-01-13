"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Heart,
  Camera,
  Settings,
  FolderOpen,
  Plus,
  Tag,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
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
  { key: "scanRecipe", href: "/dashboard/scan", icon: Camera },
  { key: "recipeBook", href: "/dashboard/recipe-book", icon: BookOpen },
];

const secondaryNavigation: NavItem[] = [
  { key: "settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside className="hidden md:flex w-64 bg-warm-white border-r border-warm-gray-100 flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-warm-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🍳</span>
          <span className="font-display text-xl text-warm-gray-700">
            {t.common.appName}
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {/* Add Recipe Button */}
        <Link
          href="/dashboard/recipes/new"
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-peach-300 hover:bg-peach-400 text-warm-gray-700 font-medium transition-colors mb-4"
        >
          <Plus className="w-5 h-5" />
          <span>{t.nav.addRecipe}</span>
        </Link>

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
            >
              <item.icon className="w-5 h-5" />
              <span>{t.nav[item.key]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="p-4 border-t border-warm-gray-100">
        {secondaryNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-warm-gray-500 hover:bg-peach-50 hover:text-peach-600 transition-colors",
                isActive && "bg-peach-100 text-peach-700"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{t.nav[item.key]}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
