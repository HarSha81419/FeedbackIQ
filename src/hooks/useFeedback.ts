import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FeedbackFilters, FeedbackItem, PaginatedResponse } from '@/types';
import { listFeedback, fetchFeedbackById, semanticSearch, uploadCsv, similarFeedback, createFeedback } from '@/services/feedback.service';

export function useFeedbackList(filters: Partial<FeedbackFilters>, page = 1, pageSize = 50) {
  return useQuery<PaginatedResponse<FeedbackItem>>({
    queryKey: ['feedback', filters, page, pageSize],
    queryFn: async () => {
      const data = await listFeedback(filters, page, pageSize);
      return data;
    },
  });
}

export function useFeedbackItem(id?: string) {
  return useQuery({
    queryKey: ['feedback', 'item', id],
    queryFn: async () => {
      if (!id) return undefined;
      return fetchFeedbackById(id);
    },
    enabled: !!id,
  });
}

export function useSemanticSearch() {
  return useMutation({ mutationFn: ({ query, top_k }: { query: string; top_k?: number }) => semanticSearch(query, top_k ?? 5) });
}

export function useUploadCsv() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (file: File) => uploadCsv(file), onSuccess: () => qc.invalidateQueries({ queryKey: ['feedback'] }) });
}

export function useSimilarFeedback() {
  return useMutation({ mutationFn: ({ id, limit }: { id: string | number; limit?: number }) => similarFeedback(id, limit ?? 5) });
}

export function useCreateFeedback() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (payload: Partial<FeedbackItem>) => createFeedback(payload), onSuccess: () => qc.invalidateQueries({ queryKey: ['feedback'] }) });
}
