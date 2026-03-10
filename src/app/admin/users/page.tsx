import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminPageFrame, ChartCard, DataTable, MetricCard, SimpleTrendChart } from '@/components/admin/AdminPageFrame';
import { getAdminDashboardData, getDefaultFilters } from '@/lib/admin/analytics';

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = getDefaultFilters(await searchParams);
  const data = await getAdminDashboardData(filters);

  return (
    <AdminPageFrame title="Users" description="User counts, anonymous vs registered mix, and balance-heavy accounts.">
      <AdminFilters filters={filters} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total users" value={String(data.kpis.totalUsers)} />
        <MetricCard label="Anonymous sessions" value={String(data.anonymousSessionsInRange)} helper="Events in selected range" />
        <MetricCard label="Registered conversions" value={String(data.registeredEventsInRange)} helper="Events in selected range" />
        <MetricCard label="New profiles in range" value={String(data.kpis.newUsersInRange)} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <ChartCard title="User creation trend">
          <SimpleTrendChart rows={data.trends} lines={[{ key: 'users', color: '#CC7052', label: 'Users' }]} />
        </ChartCard>
        <ChartCard title="Highest balances">
          <DataTable
            columns={['Display name', 'Credits', 'Created']}
            rows={data.highestBalances.map((row) => [row.displayName ?? row.id.slice(0, 8), String(row.credits), new Date(row.createdAt).toLocaleDateString()])}
          />
        </ChartCard>
      </div>
    </AdminPageFrame>
  );
}
