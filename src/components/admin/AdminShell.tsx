import Link from 'next/link';
import { BarChart3, Coins, Users, ScanSearch, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { href: '/admin', label: 'Overview', icon: BarChart3 },
  { href: '/admin/revenue', label: 'Revenue & Credits', icon: Coins },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/recipes-scans', label: 'Recipes & Scans', icon: ScanSearch },
  { href: '/admin/operations', label: 'Operations', icon: ShieldCheck },
];

export function AdminShell({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cream text-warm-gray-700">
      <aside className="hidden md:flex w-72 flex-col border-r border-warm-gray-100 bg-warm-white">
        <div className="border-b border-warm-gray-100 px-6 py-6">
          <p className="font-display text-2xl text-warm-gray-700">Recipe Keeper</p>
          <p className="mt-1 text-sm text-warm-gray-500">Admin analytics portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-peach-100 text-peach-700'
                    : 'text-warm-gray-500 hover:bg-peach-50 hover:text-peach-600'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
