import type { Customer, FeedbackItem } from '@/types';
import { mockCustomers, mockFeedback } from './mockData';
import { mockDelay } from './mock';

export async function fetchCustomers(): Promise<Customer[]> {
  await mockDelay(500);
  return mockCustomers;
}

export async function fetchCustomerById(id: string): Promise<Customer | undefined> {
  await mockDelay(400);
  return mockCustomers.find((c) => c.id === id);
}

export async function fetchCustomerFeedback(customerId: string): Promise<FeedbackItem[]> {
  await mockDelay(400);
  return mockFeedback.filter((f) => f.customerId === customerId);
}
