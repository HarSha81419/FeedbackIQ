export type Sentiment = 'positive' | 'neutral' | 'negative';
export type Urgency = 'low' | 'medium' | 'high' | 'critical';
export type UserRole = 'admin' | 'analyst' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  name: string;
}

export interface KpiMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

export interface TrendDataPoint {
  date: string;
  feedback: number;
  negative: number;
  positive: number;
}

export interface FeedbackItem {
  id: string;
  customerId: string;
  customerName: string;
  content: string;
  sentiment: Sentiment;
  category: string;
  urgency: Urgency;
  source: string;
  createdAt: string;
  score?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  churnRisk: number;
  lifetimeValue: number;
  feedbackCount: number;
  lastActive: string;
  segment: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: Urgency;
  category: string;
  createdAt: string;
  status: 'active' | 'resolved' | 'acknowledged';
}

export interface Insight {
  id: string;
  title: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
}

export interface Citation {
  id: string;
  feedbackId: string;
  excerpt: string;
  sentiment: Sentiment;
  relevance: number;
}

export interface DashboardData {
  kpis: KpiMetric[];
  trendData: TrendDataPoint[];
  recentFeedback: FeedbackItem[];
  insights: Insight[];
  sentimentDistribution: { name: string; value: number; color: string }[];
}

export interface FeedbackFilters {
  search: string;
  sentiment: Sentiment | 'all';
  category: string;
  dateFrom: string;
  dateTo: string;
  urgency: Urgency | 'all';
}

export interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed?: string;
}
