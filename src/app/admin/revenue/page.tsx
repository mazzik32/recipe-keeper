import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminPageFrame, ChartCard, DataTable, MetricCard, SimpleBarList, SimpleTrendChart } from '@/components/admin/AdminPageFrame';
import { getAdminDashboardData, getDefaultFilters } from '@/lib/admin/analytics';

export default async function AdminRevenuePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = getDefaultFilters(await searchParams);
  const data = await getAdminDashboardData(filters);

  return (
    <AdminPageFrame title="Revenue & Credits" description="Credit purchases, consumption, channel mix, and balance visibility.">
      <AdminFilters filters={filters} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Purchased credits" value={String(data.kpis.creditsPurchasedInRange)} />
        <MetricCard label="Consumed credits" value={String(data.kpis.creditsConsumedInRange)} />
        <MetricCard label="Transactions in range" value={String(data.kpis.totalTransactionsInRange)} />
        <MetricCard label="Outstanding balance" value={String(data.kpis.outstandingCredits)} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <ChartCard title="Purchased vs consumed credits">
          <SimpleTrendChart
            rows={data.trends}
            lines={[
              { key: 'creditsPurchased', color: '#CC7052', label: 'Purchased credits' },
              { key: 'creditsConsumed', color: '#7BA3C9', label: 'Consumed credits' },
            ]}
          />
        </ChartCard>
        <ChartCard title="Channel breakdown">
          <SimpleBarList rows={data.channelBreakdown} />
        </ChartCard>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Pack breakdown">
          <SimpleBarList rows={data.packBreakdown} />
        </ChartCard>
        <ChartCard title="Recent purchases">
          <DataTable
            columns={['Source', 'Pack', 'Credits', 'User', 'User type', 'Created']}
            rows={data.recentPurchases.map((row) => [row.source, row.packCode ?? 'unknown', String(row.amount), row.userEmail ?? 'No email', row.userType, new Date(row.createdAt).toLocaleString()])}
          />
        </ChartCard>
      </div>
    </AdminPageFrame>
  );
}
