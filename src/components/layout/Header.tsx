"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LogOut, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  user: {
    email?: string;
    displayName?: string;
  };
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
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
    <header className="h-16 bg-warm-white border-b border-warm-gray-100 px-6 flex items-center justify-between">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray-400" />
          <Input
            type="search"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-warm-gray-200 focus:ring-peach-300 bg-warm-gray-50"
          />
        </div>
      </form>

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
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
