import type { Customer, FeedbackItem } from '@/types';
import { api } from './api';

export async function fetchCustomers(): Promise<Customer[]> {
  const { data } = await api.get<Customer[]>('/customers');
  console.log('Customer list response', data);
  return data;
}

export async function fetchCustomerById(id: string): Promise<Customer | undefined> {
  const { data } = await api.get<Customer[]>('/customers');
  return data.find((c) => c.id === id);
}

export async function fetchCustomerFeedback(customerId: string): Promise<FeedbackItem[]> {
  // Fetch a reasonably large page and filter client-side by customerId
  const { data } = await api.get<{ items: FeedbackItem[] }>('/feedback', { params: { page: 1, pageSize: 200 } });
  const items = (data.items ?? []) as FeedbackItem[];
  const filtered = items.filter((f) => f.customerId === customerId || f.customerId === `c-${customerId}`);
  console.log('fetchCustomerFeedback', { customerId, count: filtered.length });
  return filtered;
}
