import type {
  FeedbackFilters,
  FeedbackItem,
  PaginatedResponse,
  SemanticSearchResponse,
  SemanticSearchResult,
  UploadResponse,
} from '@/types';
import { api } from './api';

export async function listFeedback(
  filters?: Partial<FeedbackFilters>,
  page = 1,
  pageSize = 50
): Promise<PaginatedResponse<FeedbackItem>> {
  const params: Record<string, any> = { page, pageSize };
  if (filters) {
    if (filters.search) params.search = filters.search;
    if (filters.sentiment && filters.sentiment !== 'all') params.sentiment = filters.sentiment;
    if (filters.category) params.category = filters.category;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.urgency && filters.urgency !== 'all') params.urgency = filters.urgency;
  }

  const { data } = await api.get<PaginatedResponse<FeedbackItem>>('/feedback', { params });
  console.log('listFeedback response', data);
  return data;
}

export async function fetchFeedback(filters?: Partial<FeedbackFilters>): Promise<FeedbackItem[]> {
  const page = 1;
  const pageSize = 200;
  const paged = await listFeedback(filters, page, pageSize);
  return paged.items;
}

export async function fetchFeedbackById(id: string): Promise<FeedbackItem | undefined> {
  const { data } = await api.get<FeedbackItem>(`/feedback/${id}`);
  console.log('fetchFeedbackById', data);
  return data;
}

export async function createFeedback(payload: Partial<FeedbackItem>): Promise<FeedbackItem> {
  const { data } = await api.post<FeedbackItem>('/feedback', payload);
  console.log('createFeedback', data);
  return data;
}

export async function uploadCsv(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<UploadResponse>('/feedback/upload-csv', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  console.log('uploadCsv', data);
  return data;
}

export async function semanticSearch(query: string, top_k = 5): Promise<SemanticSearchResponse> {
  const body = { query, limit: top_k };
  const { data } = await api.post<SemanticSearchResponse>('/semantic-search', body);
  console.log('semanticSearch', data);
  return data;
}

export async function similarFeedback(feedbackId: string | number, limit = 5): Promise<SemanticSearchResult[]> {
  const { data } = await api.get<SemanticSearchResult[]>(`/similar-feedback/${feedbackId}`, {
    params: { limit },
  });
  console.log('similarFeedback', data);
  return data;
}

export async function deleteAllFeedback(): Promise<void> {
  await api.delete('/feedback');
}

export async function getDatasetStats(): Promise<{
  total_feedback: number;
  sentiment_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
}> {
  const { data } = await api.get('/feedback/stats');
  return data;
}

export async function replaceDataset(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<UploadResponse>('/feedback/replace-dataset', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
