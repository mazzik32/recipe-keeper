import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminPageFrame, ChartCard, DataTable, MetricCard, SimpleTrendChart } from '@/components/admin/AdminPageFrame';
import { getAdminDashboardData, getDefaultFilters } from '@/lib/admin/analytics';

export default async function AdminRecipesScansPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = getDefaultFilters(await searchParams);
  const data = await getAdminDashboardData(filters);

  return (
    <AdminPageFrame title="Recipes & Scans" description="Recipe creation throughput and scan completion activity across channels.">
      <AdminFilters filters={filters} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Recipes created" value={String(data.kpis.recipesCreatedInRange)} />
        <MetricCard label="Scans completed" value={String(data.kpis.scansCompletedInRange)} />
        <MetricCard label="Purchased credits" value={String(data.kpis.creditsPurchasedInRange)} />
        <MetricCard label="Consumed credits" value={String(data.kpis.creditsConsumedInRange)} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Recipes vs scans trend">
          <SimpleTrendChart
            rows={data.trends}
            lines={[
              { key: 'recipes', color: '#CC7052', label: 'Recipes' },
              { key: 'scansCompleted', color: '#7CB97C', label: 'Scans completed' },
            ]}
          />
        </ChartCard>
        <ChartCard title="Recent scan completions">
          <DataTable
            columns={['Channel', 'Mode', 'User', 'User type', 'Occurred at']}
            rows={data.recentScans.map((row) => [row.channel ?? 'unknown', row.mode ?? 'unknown', row.userEmail ?? 'No email', row.userType, new Date(row.occurredAt).toLocaleString()])}
          />
        </ChartCard>
      </div>
      <div className="mt-6">
        <ChartCard title="Recent recipe creations">
          <DataTable
            columns={['Title', 'User', 'Created at']}
            rows={data.recentRecipes.map((row) => [row.title, row.userEmail ?? row.userId.slice(0, 8), new Date(row.createdAt).toLocaleString()])}
          />
        </ChartCard>
      </div>
    </AdminPageFrame>
  );
}
