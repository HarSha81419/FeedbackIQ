import type {
  Alert,
  CategoryItem,
  Customer,
  DashboardData,
  TrendDataPoint,
} from '@/types';
import { api } from './api';

export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await api.get<DashboardData>('/dashboard');
  console.log('Dashboard response', data);
  return data;
}

export async function fetchTrendData(): Promise<TrendDataPoint[]> {
  const { data } = await api.get<{ trendData: TrendDataPoint[] }>('/analytics/trends');
  console.log('Trend response', data);
  return data.trendData;
}

export async function fetchSentimentDistribution(): Promise<DashboardData['sentimentDistribution']> {
  const { data } = await api.get<{ distribution: DashboardData['sentimentDistribution'] }>('/analytics/sentiment-distribution');
  console.log('Sentiment distribution response', data);
  return data.distribution;
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  const { data } = await api.get<{ categories: CategoryItem[] }>('/analytics/categories');
  console.log('Category response', data);
  return data.categories;
}

export async function fetchAlerts(): Promise<Alert[]> {
  const { data } = await api.get<Alert[]>('/alerts');
  console.log('Alerts response', data);
  return data;
}

export async function fetchCustomers(): Promise<Customer[]> {
  const { data } = await api.get<Customer[]>('/customers');
  console.log('Customers response', data);
  return data;
}
