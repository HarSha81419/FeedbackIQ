import type { DashboardData } from '@/types';
import { mockDashboard } from './mockData';
import { mockDelay } from './mock';

export async function fetchDashboard(): Promise<DashboardData> {
  await mockDelay(700);
  return mockDashboard;
}
