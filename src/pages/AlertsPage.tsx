import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SpikeChart } from '@/components/charts/SpikeChart';
import { heatmapData } from '@/services/mockData';
import { fetchAlerts, fetchCategories } from '@/services/dashboard.service';
import { formatRelativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';

export function AlertsPage() {
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['analytics', 'categories'],
    queryFn: fetchCategories,
  });

  const maxHeat = Math.max(...heatmapData.map((h) => h.value));
  const topCategory = categories?.[0]?.category ?? 'N/A';
  const avgRiskScore = alerts?.length
    ? (
        alerts.reduce((sum, alert) => {
          const weight = alert.severity === 'critical' ? 1 : alert.severity === 'high' ? 0.85 : alert.severity === 'medium' ? 0.6 : 0.3;
          return sum + weight;
        }, 0) / alerts.length
      ).toFixed(2)
    : '0.00';

  return (
    <>
      <PageHeader title="Alerts & Trends" subtitle="Monitor spikes, risks, and timeline analytics" />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: 'Active alerts',
            value: alertsLoading ? '–' : alerts?.length ?? 0,
            trend: alertsLoading ? 'Loading' : `Updated ${alerts?.length ?? 0} items`,
            risk: 'high',
          },
          {
            label: 'Spike categories',
            value: categoriesLoading ? '–' : categories?.length ?? 0,
            trend: categoriesLoading ? 'Loading' : topCategory,
            risk: 'medium',
          },
          {
            label: 'Risk score avg',
            value: alertsLoading ? '–' : avgRiskScore,
            trend: alertsLoading ? 'Loading' : `${alerts?.length ?? 0} alerts`,
            risk: 'high',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-xl p-5"
          >
            <p className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-semibold text-slate-100 mt-1">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> {stat.trend}
            </p>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Card padding="lg">
          <CardHeader title="Complaint spikes by category" subtitle="Current vs previous period" />
          <SpikeChart />
        </Card>
        <Card padding="lg">
          <CardHeader title="Activity heatmap" subtitle="Complaint volume by day & time" />
          <div className="grid grid-cols-4 gap-2 mt-4">
            {heatmapData.map((cell) => (
              <div
                key={`${cell.day}-${cell.hour}`}
                className="rounded-lg p-3 text-center"
                style={{
                  background: `rgba(34, 211, 238, ${0.1 + (cell.value / maxHeat) * 0.5})`,
                }}
              >
                <p className="text-[10px] text-slate-500">{cell.day}</p>
                <p className="text-xs text-slate-300">{cell.hour}</p>
                <p className="text-sm font-medium text-slate-200 mt-1">{cell.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <CardHeader title="Active alerts" />
        <div className="space-y-3">
          {alerts?.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'flex items-start gap-4 rounded-xl border p-4',
                alert.severity === 'critical'
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-border bg-surface-elevated/30'
              )}
            >
              <AlertTriangle
                className={cn(
                  'h-5 w-5 shrink-0 mt-0.5',
                  alert.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-slate-200">{alert.title}</h4>
                  <Badge variant={alert.severity}>{alert.severity}</Badge>
                  <Badge>{alert.status}</Badge>
                </div>
                <p className="text-sm text-slate-400">{alert.description}</p>
                <p className="text-xs text-slate-600 mt-2">
                  {alert.category} · {formatRelativeTime(alert.createdAt)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </>
  );
}
