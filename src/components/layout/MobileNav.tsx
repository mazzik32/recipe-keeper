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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "My Recipes", href: "/dashboard", icon: Home },
  { name: "Categories", href: "/dashboard/categories", icon: FolderOpen },
  { name: "Tags", href: "/dashboard/tags", icon: Tag },
  { name: "Collections", href: "/dashboard/collections", icon: Library },
  { name: "Favorites", href: "/dashboard/favorites", icon: Heart },
  { name: "Scan Recipe", href: "/dashboard/scan", icon: Camera },
  { name: "Recipe Book", href: "/dashboard/recipe-book", icon: BookOpen },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

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
          "fixed top-0 left-0 h-full w-72 bg-warm-white z-50 transform transition-transform duration-300 ease-in-out md:hidden",
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
              Recipe Keeper
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
          <Link
            href="/dashboard/recipes/new"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-peach-300 hover:bg-peach-400 text-warm-gray-700 font-medium transition-colors mb-4"
            onClick={() => setIsOpen(false)}
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
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
