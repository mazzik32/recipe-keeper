"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, Settings, Plus, Camera, Upload, Link as LinkIcon, Type, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
    key: string;
    href: string;
    icon: React.ElementType;
    label: string;
    isAction?: boolean;
}

const navigation: NavItem[] = [
    { key: "home", href: "/dashboard", icon: Home, label: "Home" },
    { key: "search", href: "/dashboard/search", icon: Search, label: "Search" },
    { key: "add", href: "/dashboard/recipes/new", icon: Plus, label: "Add", isAction: true },
    { key: "favorites", href: "/dashboard/favorites", icon: Heart, label: "Favorites" },
    { key: "settings", href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-warm-white border-t border-warm-gray-100 safe-area-bottom">
            <div className="flex items-center justify-around h-16 px-1">
                {navigation.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    // Special FAB button with dropdown
                    if (item.isAction) {
                        return (
                            <DropdownMenu key={item.key}>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="flex items-center justify-center -mt-4"
                                        aria-label={item.label}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-peach-300 flex items-center justify-center shadow-lg hover:bg-peach-400 active:scale-95 transition-all">
                                            <Icon className="w-6 h-6 text-warm-gray-700" />
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="center" side="top" className="w-52 mb-2">
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/scan?mode=image" className="flex items-center gap-3 cursor-pointer">
                                            <Camera className="w-4 h-4" />
                                            <span>Take Photo / Upload</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/scan?mode=web" className="flex items-center gap-3 cursor-pointer">
                                            <LinkIcon className="w-4 h-4" />
                                            <span>Import from URL</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/scan?mode=text" className="flex items-center gap-3 cursor-pointer">
                                            <Type className="w-4 h-4" />
                                            <span>Paste Recipe Text</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/recipes/new" className="flex items-center gap-3 cursor-pointer">
                                            <PenTool className="w-4 h-4" />
                                            <span>Create Manually</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        );
                    }

                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 py-2 flex-1 max-w-[72px]",
                                isActive ? "text-peach-600" : "text-warm-gray-400"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px] font-medium truncate w-full text-center">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
