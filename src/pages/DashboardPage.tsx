import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TrendChart } from '@/components/charts/TrendChart';
import { SentimentChart } from '@/components/charts/SentimentChart';
import { KpiSkeleton, ChartSkeleton } from '@/components/ui/Skeleton';
import { fetchDashboard } from '@/services/dashboard.service';
import { formatRelativeTime } from '@/utils/format';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Real-time customer intelligence overview"
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : data?.kpis.map((kpi, i) => <KpiCard key={kpi.label} metric={kpi} index={i} />)}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card className="xl:col-span-2" padding="lg">
          <CardHeader title="Feedback trends" subtitle="14-day volume & negative sentiment" />
          {isLoading ? <ChartSkeleton /> : <TrendChart data={data?.trendData ?? []} />}
        </Card>
        <Card padding="lg">
          <CardHeader title="Sentiment distribution" />
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <>
              <SentimentChart data={data?.sentimentDistribution ?? []} />
              <div className="flex justify-center gap-4 mt-2">
                {data?.sentimentDistribution.map((s) => (
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
              : data?.recentFeedback.map((fb, i) => (
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
              : data?.insights.map((insight, i) => (
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
