import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ChurnRiskChart } from '@/components/charts/ChurnRiskChart';
import { fetchCustomers, fetchCustomerFeedback } from '@/services/customer.service';
import { formatDate, formatNumber } from '@/utils/format';
import { cn } from '@/utils/cn';
import { Sparkles } from 'lucide-react';

export function Customer360Page() {
  const [selectedId, setSelectedId] = useState<string>('c-1');

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const selected = customers?.find((c) => c.id === selectedId) ?? customers?.[0];
  const activeId = selected?.id ?? 'c-1';

  const { data: feedback } = useQuery({
    queryKey: ['customer-feedback', activeId],
    queryFn: () => fetchCustomerFeedback(activeId),
    enabled: !!activeId,
  });

  const categories = feedback?.reduce(
    (acc, f) => {
      acc[f.category] = (acc[f.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <>
      <PageHeader title="Customer 360" subtitle="Unified customer intelligence profiles" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1" padding="sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-3 py-2">
            Customers
          </p>
          <div className="space-y-1">
            {customers?.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  'w-full text-left rounded-lg px-3 py-3 transition-colors',
                  activeId === c.id
                    ? 'bg-accent-cyan/10 border border-accent-cyan/20'
                    : 'hover:bg-white/5'
                )}
              >
                <p className="text-sm font-medium text-slate-200">{c.name}</p>
                <p className="text-xs text-slate-500">{c.company}</p>
              </button>
            ))}
          </div>
        </Card>

        {selected ? (
          <div className="lg:col-span-3 space-y-6">
            <Card padding="lg">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">{selected.name}</h2>
                  <p className="text-sm text-slate-500">{selected.email} · {selected.company}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge>{selected.segment}</Badge>
                    <Badge variant={selected.churnRisk > 0.6 ? 'critical' : 'low'}>
                      {selected.churnRisk > 0.6 ? 'High risk' : 'Stable'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <p className="text-slate-500">LTV</p>
                    <p className="font-semibold text-slate-200">${formatNumber(selected.lifetimeValue)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Feedback</p>
                    <p className="font-semibold text-slate-200">{selected.feedbackCount}</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card padding="lg">
                <CardHeader title="Churn risk" />
                <ChurnRiskChart value={selected.churnRisk} />
              </Card>
              <Card padding="lg">
                <CardHeader title="Complaint categories" />
                <div className="space-y-3">
                  {categories &&
                    Object.entries(categories).map(([cat, count]) => (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">{cat}</span>
                          <span className="text-slate-300">{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent-cyan/60"
                            style={{ width: `${(count / (feedback?.length || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>

            <Card padding="lg">
              <CardHeader title="AI customer summary" />
              <div className="rounded-lg border border-accent-indigo/20 bg-accent-indigo/5 p-4 flex gap-3">
                <Sparkles className="h-5 w-5 text-accent-indigo shrink-0" />
                <p className="text-sm text-slate-300 leading-relaxed">
                  {selected.name} is an {selected.segment.toLowerCase()} customer with{' '}
                  {selected.churnRisk > 0.6 ? 'elevated' : 'moderate'} churn risk. Recent feedback
                  highlights {Object.keys(categories ?? {})[0] ?? 'product'} concerns. Recommend
                  proactive outreach and billing review if risk score exceeds 0.7.
                </p>
              </div>
            </Card>

            <Card padding="lg">
              <CardHeader title="Feedback timeline" />
              <div className="space-y-4">
                {feedback?.map((fb) => (
                  <div key={fb.id} className="flex gap-4 border-l-2 border-border pl-4">
                    <div className="text-xs text-slate-500 w-20 shrink-0">
                      {formatDate(fb.createdAt)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={fb.sentiment}>{fb.sentiment}</Badge>
                        <span className="text-xs text-slate-500">{fb.category}</span>
                      </div>
                      <p className="text-sm text-slate-300">{fb.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </>
  );
}
