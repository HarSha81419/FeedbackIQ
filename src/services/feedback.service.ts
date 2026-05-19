import type { FeedbackFilters, FeedbackItem } from '@/types';
import { mockFeedback } from './mockData';
import { mockDelay } from './mock';

export async function fetchFeedback(filters?: Partial<FeedbackFilters>): Promise<FeedbackItem[]> {
  await mockDelay(500);
  let items = [...mockFeedback];

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (f) =>
        f.content.toLowerCase().includes(q) ||
        f.customerName.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }
  if (filters?.sentiment && filters.sentiment !== 'all') {
    items = items.filter((f) => f.sentiment === filters.sentiment);
  }
  if (filters?.category) {
    const category = filters.category;
    items = items.filter((f) => f.category.toLowerCase() === category.toLowerCase());
  }
  if (filters?.urgency && filters.urgency !== 'all') {
    items = items.filter((f) => f.urgency === filters.urgency);
  }

  return items;
}

export async function fetchFeedbackById(id: string): Promise<FeedbackItem | undefined> {
  await mockDelay(300);
  return mockFeedback.find((f) => f.id === id);
}
