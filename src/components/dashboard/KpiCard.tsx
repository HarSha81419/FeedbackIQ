import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { KpiMetric } from '@/types';
import { cn } from '@/utils/cn';

const icons: Record<string, string> = {
  'Total Feedback': '📊',
  'Negative Sentiment %': '📉',
  'Churn Risk Count': '⚠️',
  'Active Alerts': '🔔',
};

export function KpiCard({ metric, index }: { metric: KpiMetric; index: number }) {
  const TrendIcon =
    metric.trend === 'up' ? ArrowUpRight : metric.trend === 'down' ? ArrowDownRight : Minus;
  const changePositive = metric.change && metric.change > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="glass rounded-xl p-5 hover:border-accent-cyan/20 transition-colors group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {metric.label}
        </span>
        <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">
          {icons[metric.label] ?? '•'}
        </span>
      </div>
      <p className="text-2xl font-semibold text-slate-100 tracking-tight">{metric.value}</p>
      {metric.change !== undefined ? (
        <div
          className={cn(
            'flex items-center gap-1 mt-2 text-xs font-medium',
            metric.trend === 'down' && metric.label.includes('Negative')
              ? 'text-emerald-400'
              : changePositive
                ? 'text-emerald-400'
                : 'text-red-400'
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{Math.abs(metric.change)}% vs last period</span>
        </div>
      ) : null}
    </motion.div>
  );
}
