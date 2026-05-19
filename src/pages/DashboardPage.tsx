import { motion } from 'framer-motion';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TrendChart } from '@/components/charts/TrendChart';
import { SentimentChart } from '@/components/charts/SentimentChart';
import { KpiSkeleton, ChartSkeleton } from '@/components/ui/Skeleton';
import { useDashboard } from '@/hooks/useDashboard';
import { formatRelativeTime } from '@/utils/format';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const {
    dashboardQuery,
    trendsQuery,
    sentimentQuery,
    categoriesQuery,
    alertsQuery,
    customersQuery,
    isLoading,
    isError,
    error,
  } = useDashboard();

  const kpis = dashboardQuery.data?.kpis ?? [];
  const trendData = trendsQuery.data ?? dashboardQuery.data?.trendData ?? [];
  const sentimentData = sentimentQuery.data ?? dashboardQuery.data?.sentimentDistribution ?? [];
  const recentFeedback = dashboardQuery.data?.recentFeedback ?? [];
  const insights = dashboardQuery.data?.insights ?? [];
  const topCategories = categoriesQuery.data ?? [];
  const topAlerts = alertsQuery.data ?? [];
  const topCustomers = customersQuery.data?.slice(0, 3) ?? [];
  const errorMessage = error instanceof Error ? error.message : String(error ?? 'Unknown error');

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Real-time customer intelligence overview" />

      {isError ? (
        <Card padding="lg" className="border border-rose-500/20 bg-rose-500/5 mb-6">
          <p className="text-sm font-semibold text-rose-100">Unable to load dashboard data.</p>
          <p className="text-xs text-rose-200 mt-1">{errorMessage}</p>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((kpi, i) => <KpiCard key={kpi.label} metric={kpi} index={i} />)}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card className="xl:col-span-2" padding="lg">
          <CardHeader title="Feedback trends" subtitle="14-day volume & negative sentiment" />
          {isLoading ? <ChartSkeleton /> : <TrendChart data={trendData} />}
        </Card>

        <Card padding="lg">
          <CardHeader title="Sentiment distribution" />
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <>
              <SentimentChart data={sentimentData} />
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {sentimentData.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.name} {s.value}%
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card padding="lg">
          <CardHeader title="Top categories" subtitle="Backend analytics categories" />
          <div className="space-y-3">
            {categoriesQuery.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
                ))
              : topCategories.length > 0 ? (
                  topCategories.map((category) => (
                    <div key={category.category} className="rounded-xl border border-border/50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-slate-200">{category.category}</p>
                        <p className="text-sm font-semibold text-slate-100">{category.count}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No category analytics available yet.</p>
                )}
          </div>
        </Card>

        <Card padding="lg">
          <CardHeader title="Recent alerts" subtitle="Active issues from backend" />
          <div className="space-y-3">
            {alertsQuery.isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-white/5 animate-pulse" />
                ))
              : topAlerts.length > 0 ? (
                  topAlerts.slice(0, 4).map((alert, i) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="rounded-xl border border-border/50 p-4"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="text-sm font-medium text-slate-200">{alert.title}</h4>
                        <Badge variant={alert.severity}>{alert.severity}</Badge>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2">{alert.description}</p>
                      <p className="text-xs text-slate-600 mt-2">
                        {alert.category} · {formatRelativeTime(alert.createdAt)}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No alerts found for this period.</p>
                )}
          </div>
        </Card>

        <Card padding="lg">
          <CardHeader title="Customer analytics" subtitle="Backend customer performance" />
          <div className="space-y-3">
            {customersQuery.isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-white/5 animate-pulse" />
                ))
              : topCustomers.length > 0 ? (
                  topCustomers.map((customer) => (
                    <div key={customer.id} className="rounded-xl border border-border/50 p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-medium text-slate-200">{customer.name}</p>
                          <p className="text-xs text-slate-500">{customer.company}</p>
                        </div>
                        <Badge variant={customer.churnRisk > 0.65 ? 'critical' : 'low'}>
                          {customer.churnRisk > 0.65 ? 'High risk' : 'Stable'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{customer.feedbackCount} feedback</span>
                        <span>Last active {formatRelativeTime(customer.lastActive)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No customers available yet.</p>
                )}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <CardHeader
            title="Recent complaints"
            action={
              <Link to="/feedback" className="text-xs text-accent-cyan flex items-center gap-1 hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
                ))
              : recentFeedback.map((fb, i) => (
                  <motion.div
                    key={fb.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-lg border border-border/50 p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-medium text-slate-200">{fb.customerName}</span>
                      <Badge variant={fb.sentiment}>{fb.sentiment}</Badge>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{fb.content}</p>
                    <p className="text-xs text-slate-600 mt-2">{formatRelativeTime(fb.createdAt)}</p>
                  </motion.div>
                ))}
          </div>
        </Card>

        <Card padding="lg">
          <CardHeader title="AI-generated insights" subtitle="Powered by FeedbackIQ intelligence" />
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-white/5 animate-pulse" />
                ))
              : insights.map((insight, i) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-lg border border-accent-indigo/20 bg-accent-indigo/5 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-4 w-4 text-accent-indigo shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-slate-200">{insight.title}</h4>
                          <Badge className="capitalize">{insight.impact}</Badge>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">{insight.summary}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
          </div>
        </Card>
      </section>
    </>
  );
}
