"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { AdminFilters as AdminFiltersType } from '@/lib/admin/analytics';

export function AdminFilters({ filters }: { filters: AdminFiltersType }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Card className="mb-6 border-warm-gray-100 bg-warm-white shadow-sm">
      <CardContent className="grid gap-4 p-4 md:grid-cols-5">
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
