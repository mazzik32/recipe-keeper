import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function AdminPageFrame({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="min-w-0 p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display text-3xl text-warm-gray-700">{title}</h1>
          <p className="mt-2 text-sm text-warm-gray-500">{description}</p>
        </div>
        <Badge variant="outline" className="w-fit border-peach-200 bg-peach-50 text-peach-700">Cloudflare Access protected</Badge>
      </div>
      {children}
    </main>
  );
}

export function MetricCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <Card className="border-warm-gray-100 bg-warm-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-warm-gray-500">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold text-warm-gray-700">{value}</div>
        {helper ? <p className="mt-2 text-xs text-warm-gray-400">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-warm-gray-100 bg-warm-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-warm-gray-700">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function SimpleBarList({ rows }: { rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="space-y-4">
      {rows.length === 0 ? <p className="text-sm text-warm-gray-400">No data in the selected range.</p> : null}
      {rows.map((row) => (
        <div key={row.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm text-warm-gray-600">
            <span>{row.label}</span>
            <span className="font-medium text-warm-gray-700">{row.value}</span>
          </div>
          <div className="h-2 rounded-full bg-warm-gray-100">
            <div
              className="h-2 rounded-full bg-peach-400"
              style={{ width: `${Math.max((row.value / max) * 100, row.value > 0 ? 8 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SimpleTrendChart<T extends { bucket: string }>({ rows, lines }: { rows: T[]; lines: Array<{ key: Extract<keyof T, string>; color: string; label: string }> }) {
  const values = rows.flatMap((row) => lines.map((line) => Number(row[line.key] ?? 0)));
  const max = Math.max(...values, 1);
  const width = Math.max(rows.length * 84, 320);
  const height = 180;
  const padding = 24;

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height + 28} className="min-w-full">
        {lines.map((line) => {
          const points = rows.map((row, index) => {
            const x = padding + (index * (width - padding * 2)) / Math.max(rows.length - 1, 1);
            const y = height - padding - ((Number(row[line.key] ?? 0) / max) * (height - padding * 2));
            return `${x},${y}`;
          }).join(' ');

          return <polyline key={line.key} fill="none" stroke={line.color} strokeWidth="3" points={points} />;
        })}
        {rows.map((row, index) => {
          const x = padding + (index * (width - padding * 2)) / Math.max(rows.length - 1, 1);
          const label = String(row.bucket ?? '').slice(0, 10);
          return (
            <text key={`${label}-${index}`} x={x} y={height + 16} textAnchor="middle" fontSize="10" fill="#A99E94">
              {label}
            </text>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-warm-gray-500">
        {lines.map((line) => (
          <div key={line.key} className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-full')} style={{ backgroundColor: line.color }} />
            <span>{line.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-warm-gray-100 text-left text-warm-gray-500">
            {columns.map((column) => (
              <th key={column} className="px-0 py-3 pr-6 font-medium">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-6 text-sm text-warm-gray-400">No data available.</td>
            </tr>
          ) : null}
          {rows.map((row, index) => (
            <tr key={`${row.join('-')}-${index}`} className="border-b border-warm-gray-50 text-warm-gray-600 last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="px-0 py-3 pr-6">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
