import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminPageFrame, ChartCard, DataTable, MetricCard, SimpleBarList, SimpleTrendChart } from '@/components/admin/AdminPageFrame';
import { getAdminDashboardData, getDefaultFilters } from '@/lib/admin/analytics';

export default async function AdminOverviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = getDefaultFilters(await searchParams);
  const data = await getAdminDashboardData(filters);

  return (
    <AdminPageFrame title="Overview" description="Balanced snapshot of users, credits, recipes, scans, and operational health.">
      <AdminFilters filters={filters} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total users" value={String(data.kpis.totalUsers)} />
        <MetricCard label="Anonymous users" value={String(data.kpis.anonymousUsers)} />
        <MetricCard label="Registered users" value={String(data.kpis.registeredUsers)} />
        <MetricCard label="Scans completed" value={String(data.kpis.scansCompletedInRange)} helper="Within selected range" />
        <MetricCard label="Outstanding credits" value={String(data.kpis.outstandingCredits)} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <ChartCard title="Trends over time">
          <SimpleTrendChart
            rows={data.trends}
            lines={[
              { key: 'users', color: '#CC7052', label: 'Users' },
              { key: 'recipes', color: '#7BA3C9', label: 'Recipes' },
              { key: 'scansCompleted', color: '#7CB97C', label: 'Scans completed' },
            ]}
          />
        </ChartCard>
        <ChartCard title="Purchases by channel">
          <SimpleBarList rows={data.channelBreakdown} />
        </ChartCard>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Top pack mix">
          <SimpleBarList rows={data.packBreakdown} />
        </ChartCard>
        <ChartCard title="Recent purchases">
          <DataTable
            columns={['Source', 'Pack', 'Credits', 'User type', 'Created']}
            rows={data.recentPurchases.map((row) => [row.source, row.packCode ?? 'unknown', String(row.amount), row.userType, new Date(row.createdAt).toLocaleString()])}
          />
        </ChartCard>
      </div>
    </AdminPageFrame>
  );
}
