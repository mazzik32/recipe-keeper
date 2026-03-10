import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminPageFrame, ChartCard, DataTable, MetricCard } from '@/components/admin/AdminPageFrame';
import { getAdminDashboardData, getDefaultFilters } from '@/lib/admin/analytics';

export default async function AdminOperationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = getDefaultFilters(await searchParams);
  const data = await getAdminDashboardData(filters);

  return (
    <AdminPageFrame title="Operations" description="Read-only operational visibility for webhook intake and analytics freshness.">
      <AdminFilters filters={filters} />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Recent webhook events" value={String(data.recentOperations.length)} helper="Last 25 records" />
        <MetricCard label="Purchase events in range" value={String(data.purchaseEventsInRange)} />
        <MetricCard label="Recent scan events" value={String(data.recentScans.length)} helper="Visible after instrumentation" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Webhook intake">
          <DataTable
            columns={['Provider', 'Event id', 'Received at']}
            rows={data.recentOperations.map((row) => [row.provider, row.eventId, new Date(row.receivedAt).toLocaleString()])}
          />
        </ChartCard>
        <ChartCard title="Recent credit purchases">
          <DataTable
            columns={['Source', 'Pack', 'Credits', 'Created at']}
            rows={data.recentPurchases.map((row) => [row.source, row.packCode ?? 'unknown', String(row.amount), new Date(row.createdAt).toLocaleString()])}
          />
        </ChartCard>
      </div>
    </AdminPageFrame>
  );
}
