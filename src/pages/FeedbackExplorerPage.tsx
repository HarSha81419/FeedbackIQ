import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { FeedbackTable } from '@/components/feedback/FeedbackTable';
import { FeedbackDetailPanel } from '@/components/feedback/FeedbackDetailPanel';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { fetchFeedback } from '@/services/feedback.service';
import type { FeedbackFilters, FeedbackItem, Sentiment, Urgency } from '@/types';

export function FeedbackExplorerPage() {
  const [filters, setFilters] = useState<FeedbackFilters>({
    search: '',
    sentiment: 'all',
    category: '',
    dateFrom: '',
    dateTo: '',
    urgency: 'all',
  });
  const [selected, setSelected] = useState<FeedbackItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['feedback', filters],
    queryFn: () => fetchFeedback(filters),
  });

  const categories = ['Billing', 'Product', 'Technical', 'Support', 'Churn', 'Bug', 'Documentation'];

  return (
    <>
      <PageHeader
        title="Feedback Explorer"
        subtitle="Search and analyze customer feedback semantically"
      />

      <Card className="mb-6" padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2 rounded-lg border border-border bg-surface-elevated/50 px-3 py-2">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              type="search"
              placeholder="Semantic search — e.g. billing complaints, API limits..."
              className="flex-1 bg-transparent text-sm focus:outline-none"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select
              label="Sentiment"
              value={filters.sentiment}
              onChange={(e) =>
                setFilters((f) => ({ ...f, sentiment: e.target.value as Sentiment | 'all' }))
              }
              options={[
                { value: 'all', label: 'All' },
                { value: 'positive', label: 'Positive' },
                { value: 'neutral', label: 'Neutral' },
                { value: 'negative', label: 'Negative' },
              ]}
            />
            <Select
              label="Category"
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
              options={[{ value: '', label: 'All' }, ...categories.map((c) => ({ value: c, label: c }))]}
            />
            <Select
              label="Urgency"
              value={filters.urgency}
              onChange={(e) =>
                setFilters((f) => ({ ...f, urgency: e.target.value as Urgency | 'all' }))
              }
              options={[
                { value: 'all', label: 'All' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
            />
            <Select
              label="Date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              options={[
                { value: '', label: 'Any time' },
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
              ]}
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 overflow-hidden" padding="none">
          {isLoading ? (
            <div>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </div>
          ) : (
            <FeedbackTable
              items={data ?? []}
              selectedId={selected?.id}
              onSelect={setSelected}
            />
          )}
        </Card>
        <FeedbackDetailPanel item={selected} onClose={() => setSelected(null)} />
      </div>
    </>
  );
}
