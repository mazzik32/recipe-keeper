"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Heart,
  Camera,
  FileText,
  Settings,
  FolderOpen,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "My Recipes", href: "/dashboard", icon: Home },
  { name: "Categories", href: "/dashboard/categories", icon: FolderOpen },
  { name: "Favorites", href: "/dashboard/favorites", icon: Heart },
  { name: "Scan Recipe", href: "/dashboard/scan", icon: Camera },
  { name: "Recipe Book", href: "/dashboard/recipe-book", icon: BookOpen },
];

const secondaryNavigation = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-warm-white border-r border-warm-gray-100 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-warm-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🍳</span>
          <span className="font-display text-xl text-warm-gray-700">
            Recipe Keeper
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
          <span>Add Recipe</span>
        </Link>

        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-warm-gray-500 hover:bg-peach-50 hover:text-peach-600 transition-colors",
                isActive && "bg-peach-100 text-peach-700"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
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
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-warm-gray-500 hover:bg-peach-50 hover:text-peach-600 transition-colors",
                isActive && "bg-peach-100 text-peach-700"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
