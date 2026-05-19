import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { FeedbackItem } from '@/types';
import { formatRelativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';

interface FeedbackTableProps {
  items: FeedbackItem[];
  selectedId?: string;
  onSelect: (item: FeedbackItem) => void;
}

export function FeedbackTable({ items, selectedId, onSelect }: FeedbackTableProps) {
  if (items.length === 0) {
    return (
      <p className="text-center text-sm text-slate-500 py-12">No feedback matches your filters.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-slate-500 uppercase tracking-wider">
            <th className="pb-3 pr-4 font-medium">Customer</th>
            <th className="pb-3 pr-4 font-medium hidden md:table-cell">Content</th>
            <th className="pb-3 pr-4 font-medium">Sentiment</th>
            <th className="pb-3 pr-4 font-medium hidden lg:table-cell">Category</th>
            <th className="pb-3 pr-4 font-medium hidden sm:table-cell">Urgency</th>
            <th className="pb-3 font-medium">Time</th>
            <th className="pb-3 w-8" />
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onSelect(item)}
                className={cn(
                  'border-b border-border/50 cursor-pointer transition-colors hover:bg-white/[0.02]',
                  selectedId === item.id && 'bg-accent-cyan/5'
                )}
              >
                <td className="py-4 pr-4">
                  <span className="font-medium text-slate-200">{item.customerName}</span>
                </td>
                <td className="py-4 pr-4 max-w-xs hidden md:table-cell">
                  <span className="text-slate-400 line-clamp-2">{item.content}</span>
                </td>
                <td className="py-4 pr-4">
                  <Badge variant={item.sentiment}>{item.sentiment}</Badge>
                </td>
                <td className="py-4 pr-4 text-slate-400 hidden lg:table-cell">{item.category}</td>
                <td className="py-4 pr-4 hidden sm:table-cell">
                  <Badge variant={item.urgency}>{item.urgency}</Badge>
                </td>
                <td className="py-4 text-slate-500 whitespace-nowrap">
                  {formatRelativeTime(item.createdAt)}
                </td>
                <td className="py-4">
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
