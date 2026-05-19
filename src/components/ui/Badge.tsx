import { cn } from '@/utils/cn';
import type { Sentiment, Urgency } from '@/types';

const sentimentStyles: Record<Sentiment, string> = {
  positive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  neutral: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  negative: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const urgencyStyles: Record<Urgency, string> = {
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | Sentiment | Urgency;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const style =
    variant in sentimentStyles
      ? sentimentStyles[variant as Sentiment]
      : variant in urgencyStyles
        ? urgencyStyles[variant as Urgency]
        : 'bg-accent-indigo/10 text-accent-indigo border-accent-indigo/20';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize',
        style,
        className
      )}
    >
      {children}
    </span>
  );
}
