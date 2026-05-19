import { useQuery } from '@tanstack/react-query';
import {
  fetchAlerts,
  fetchCategories,
  fetchCustomers,
  fetchDashboard,
  fetchSentimentDistribution,
  fetchTrendData,
} from '@/services/dashboard.service';

export function useDashboard() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    staleTime: 60_000,
  });

  const trendsQuery = useQuery({
    queryKey: ['analytics', 'trends'],
    queryFn: fetchTrendData,
    staleTime: 60_000,
  });

  const sentimentQuery = useQuery({
    queryKey: ['analytics', 'sentiment-distribution'],
    queryFn: fetchSentimentDistribution,
    staleTime: 60_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ['analytics', 'categories'],
    queryFn: fetchCategories,
    staleTime: 60_000,
  });

  const alertsQuery = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    staleTime: 60_000,
  });

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
    staleTime: 60_000,
  });

  const isLoading = [
    dashboardQuery.isLoading,
    trendsQuery.isLoading,
    sentimentQuery.isLoading,
    categoriesQuery.isLoading,
    alertsQuery.isLoading,
    customersQuery.isLoading,
  ].some(Boolean);

  const isError = [
    dashboardQuery.isError,
    trendsQuery.isError,
    sentimentQuery.isError,
    categoriesQuery.isError,
    alertsQuery.isError,
    customersQuery.isError,
  ].some(Boolean);

  const error =
    dashboardQuery.error ||
    trendsQuery.error ||
    sentimentQuery.error ||
    categoriesQuery.error ||
    alertsQuery.error ||
    customersQuery.error;

  return {
    dashboardQuery,
    trendsQuery,
    sentimentQuery,
    categoriesQuery,
    alertsQuery,
    customersQuery,
    isLoading,
    isError,
    error,
  };
}
