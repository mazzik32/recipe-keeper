"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AdminFilters as AdminFiltersType } from '@/lib/admin/analytics';

const quickRanges = [
  { key: 'hour', label: 'Hour', granularity: 'hour', amountMs: 60 * 60 * 1000 },
  { key: 'day', label: 'Day', granularity: 'day', amountMs: 24 * 60 * 60 * 1000 },
  { key: 'month', label: 'Month', granularity: 'month', amountMs: 30 * 24 * 60 * 60 * 1000 },
  { key: 'year', label: 'Year', granularity: 'year', amountMs: 365 * 24 * 60 * 60 * 1000 },
] as const;

export function AdminFilters({ filters }: { filters: AdminFiltersType }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateMany = (entries: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(entries).forEach(([key, value]) => params.set(key, value));
    router.push(`${pathname}?${params.toString()}`);
  };

  const update = (key: string, value: string) => updateMany({ [key]: value });

  const applyQuickRange = (range: typeof quickRanges[number]) => {
    const to = new Date();
    const from = new Date(to.getTime() - range.amountMs);
    updateMany({
      from: from.toISOString(),
      to: to.toISOString(),
      granularity: range.granularity,
    });
  };

  return (
    <Card className="mb-6 border-warm-gray-100 bg-warm-white shadow-sm">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          {quickRanges.map((range) => {
            const isActive = filters.granularity === range.granularity;
            return (
              <Button
                key={range.key}
                type="button"
                variant="outline"
                className={cn(
                  'rounded-full border-warm-gray-200 bg-warm-gray-50 text-warm-gray-600 hover:bg-peach-50 hover:text-peach-700',
                  isActive && 'border-peach-300 bg-peach-100 text-peach-700'
                )}
                onClick={() => applyQuickRange(range)}
              >
                {range.label}
              </Button>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-warm-gray-400">From</p>
            <Input type="datetime-local" value={filters.from.slice(0, 16)} onChange={(e) => update('from', new Date(e.target.value).toISOString())} className="border-warm-gray-200 bg-warm-gray-50" />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-warm-gray-400">To</p>
            <Input type="datetime-local" value={filters.to.slice(0, 16)} onChange={(e) => update('to', new Date(e.target.value).toISOString())} className="border-warm-gray-200 bg-warm-gray-50" />
          </div>
          <FilterSelect label="Granularity" value={filters.granularity} onValueChange={(value) => update('granularity', value)} items={[
            ['hour', 'Hour'], ['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['year', 'Year']
          ]} />
          <FilterSelect label="Channel" value={filters.channel} onValueChange={(value) => update('channel', value)} items={[
            ['all', 'All'], ['ios', 'iOS'], ['android', 'Android'], ['paddle-web', 'Paddle web']
          ]} />
          <FilterSelect label="User type" value={filters.userType} onValueChange={(value) => update('userType', value)} items={[
            ['all', 'All'], ['anonymous', 'Anonymous'], ['registered', 'Registered']
          ]} />
        </div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({ label, value, onValueChange, items }: { label: string; value: string; onValueChange: (value: string) => void; items: Array<[string, string]> }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-warm-gray-400">{label}</p>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="border-warm-gray-200 bg-warm-gray-50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map(([itemValue, itemLabel]) => (
            <SelectItem key={itemValue} value={itemValue}>{itemLabel}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
