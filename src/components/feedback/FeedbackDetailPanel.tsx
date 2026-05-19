import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { FeedbackItem } from '@/types';
import { formatDate } from '@/utils/format';

interface FeedbackDetailPanelProps {
  item: FeedbackItem | null;
  onClose: () => void;
}

export function FeedbackDetailPanel({ item, onClose }: FeedbackDetailPanelProps) {
  if (!item) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="glass-strong rounded-xl p-6 h-fit sticky top-24"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-100">Feedback details</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 focus-ring"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Customer</p>
          <p className="text-sm font-medium text-slate-200">{item.customerName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={item.sentiment}>{item.sentiment}</Badge>
          <Badge variant={item.urgency}>{item.urgency}</Badge>
          <Badge>{item.category}</Badge>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Content</p>
          <p className="text-sm text-slate-300 leading-relaxed">{item.content}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">Source</p>
            <p className="text-slate-300">{item.source}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Date</p>
            <p className="text-slate-300">{formatDate(item.createdAt)}</p>
          </div>
          {item.score !== undefined && (
            <div>
              <p className="text-xs text-slate-500">Sentiment score</p>
              <p className="text-slate-300">{item.score.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
