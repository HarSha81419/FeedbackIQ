import type {
  Alert,
  ApiKey,
  Customer,
  DashboardData,
  FeedbackItem,
  Integration,
  TrendDataPoint,
  User,
} from '@/types';

const days = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const mockTrendData: TrendDataPoint[] = Array.from({ length: 14 }, (_, i) => {
  const base = 120 + Math.sin(i * 0.5) * 30;
  return {
    date: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    feedback: Math.round(base + Math.random() * 40),
    negative: Math.round(base * 0.22 + Math.random() * 15),
    positive: Math.round(base * 0.55 + Math.random() * 20),
  };
});

export const mockFeedback: FeedbackItem[] = [
  {
    id: 'fb-1',
    customerId: 'c-1',
    customerName: 'Sarah Chen',
    content: 'Billing cycle is confusing — charged twice this month without clear invoice breakdown.',
    sentiment: 'negative',
    category: 'Billing',
    urgency: 'high',
    source: 'Email',
    createdAt: days(0),
    score: -0.82,
  },
  {
    id: 'fb-2',
    customerId: 'c-2',
    customerName: 'Marcus Webb',
    content: 'Love the new dashboard analytics. Export to CSV would make this perfect.',
    sentiment: 'positive',
    category: 'Product',
    urgency: 'low',
    source: 'In-app',
    createdAt: days(0),
    score: 0.91,
  },
  {
    id: 'fb-3',
    customerId: 'c-3',
    customerName: 'Elena Rodriguez',
    content: 'API rate limits hit during peak hours. Need enterprise tier or higher quotas.',
    sentiment: 'negative',
    category: 'Technical',
    urgency: 'critical',
    source: 'Support',
    createdAt: days(1),
    score: -0.65,
  },
  {
    id: 'fb-4',
    customerId: 'c-4',
    customerName: 'James Okonkwo',
    content: 'Onboarding was smooth. Documentation for webhooks could be clearer.',
    sentiment: 'neutral',
    category: 'Documentation',
    urgency: 'medium',
    source: 'Survey',
    createdAt: days(1),
    score: 0.12,
  },
  {
    id: 'fb-5',
    customerId: 'c-5',
    customerName: 'Priya Sharma',
    content: 'Considering canceling — competitor offers better pricing for our team size.',
    sentiment: 'negative',
    category: 'Churn',
    urgency: 'critical',
    source: 'Chat',
    createdAt: days(2),
    score: -0.94,
  },
  {
    id: 'fb-6',
    customerId: 'c-1',
    customerName: 'Sarah Chen',
    content: 'Support team resolved my integration issue within 2 hours. Excellent.',
    sentiment: 'positive',
    category: 'Support',
    urgency: 'low',
    source: 'Email',
    createdAt: days(3),
    score: 0.88,
  },
  {
    id: 'fb-7',
    customerId: 'c-6',
    customerName: 'Alex Kim',
    content: 'Mobile app crashes when uploading large feedback batches.',
    sentiment: 'negative',
    category: 'Bug',
    urgency: 'high',
    source: 'In-app',
    createdAt: days(4),
    score: -0.71,
  },
  {
    id: 'fb-8',
    customerId: 'c-7',
    customerName: 'Nina Patel',
    content: 'Semantic search in explorer is incredibly fast and accurate.',
    sentiment: 'positive',
    category: 'Product',
    urgency: 'low',
    source: 'NPS',
    createdAt: days(5),
    score: 0.95,
  },
];

export const mockDashboard: DashboardData = {
  kpis: [
    { label: 'Total Feedback', value: '12,847', change: 12.4, trend: 'up' },
    { label: 'Negative Sentiment %', value: '18.2%', change: -2.1, trend: 'down' },
    { label: 'Churn Risk Count', value: 47, change: 8.3, trend: 'up' },
    { label: 'Active Alerts', value: 12, change: -15, trend: 'down' },
  ],
  trendData: mockTrendData,
  recentFeedback: mockFeedback.slice(0, 5),
  insights: [
    {
      id: 'i-1',
      title: 'Billing complaints spiking',
      summary:
        'Negative billing feedback increased 34% week-over-week. Top keywords: duplicate charge, invoice, refund.',
      impact: 'high',
      createdAt: days(0),
    },
    {
      id: 'i-2',
      title: 'API limits driving enterprise churn',
      summary:
        '12 high-value accounts mentioned rate limits in the last 7 days. Correlation with churn risk score > 0.7.',
      impact: 'high',
      createdAt: days(1),
    },
    {
      id: 'i-3',
      title: 'Support CSAT improving',
      summary: 'Positive support mentions up 18%. Median resolution time decreased to 2.4 hours.',
      impact: 'medium',
      createdAt: days(2),
    },
  ],
  sentimentDistribution: [
    { name: 'Positive', value: 52, color: '#34d399' },
    { name: 'Neutral', value: 30, color: '#64748b' },
    { name: 'Negative', value: 18, color: '#f87171' },
  ],
};

export const mockCustomers: Customer[] = [
  {
    id: 'c-1',
    name: 'Sarah Chen',
    email: 'sarah@acmecorp.com',
    company: 'Acme Corp',
    churnRisk: 0.72,
    lifetimeValue: 48000,
    feedbackCount: 23,
    lastActive: days(0),
    segment: 'Enterprise',
  },
  {
    id: 'c-2',
    name: 'Marcus Webb',
    email: 'marcus@startup.io',
    company: 'Startup.io',
    churnRisk: 0.15,
    lifetimeValue: 12000,
    feedbackCount: 8,
    lastActive: days(1),
    segment: 'Growth',
  },
  {
    id: 'c-3',
    name: 'Elena Rodriguez',
    email: 'elena@techflow.com',
    company: 'TechFlow',
    churnRisk: 0.58,
    lifetimeValue: 32000,
    feedbackCount: 15,
    lastActive: days(2),
    segment: 'Enterprise',
  },
];

export const mockAlerts: Alert[] = [
  {
    id: 'a-1',
    title: 'Billing category spike',
    description: '34% increase in negative billing feedback in 48 hours',
    severity: 'critical',
    category: 'Billing',
    createdAt: days(0),
    status: 'active',
  },
  {
    id: 'a-2',
    title: 'Churn risk threshold',
    description: '5 enterprise accounts crossed 0.8 churn risk score',
    severity: 'high',
    category: 'Churn',
    createdAt: days(1),
    status: 'active',
  },
  {
    id: 'a-3',
    title: 'API complaints trend',
    description: 'Technical feedback volume up 22% vs 30-day average',
    severity: 'medium',
    category: 'Technical',
    createdAt: days(2),
    status: 'acknowledged',
  },
];

export const mockUsers: User[] = [
  {
    id: 'u-1',
    email: 'admin@feedbackiq.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: days(90),
  },
  {
    id: 'u-2',
    email: 'analyst@feedbackiq.com',
    name: 'Jane Analyst',
    role: 'analyst',
    createdAt: days(60),
  },
  {
    id: 'u-3',
    email: 'viewer@feedbackiq.com',
    name: 'View Only',
    role: 'viewer',
    createdAt: days(30),
  },
];

export const mockIntegrations: Integration[] = [
  { id: 'int-1', name: 'Zendesk', type: 'Support', status: 'connected', lastSync: days(0) },
  { id: 'int-2', name: 'Intercom', type: 'Chat', status: 'connected', lastSync: days(0) },
  { id: 'int-3', name: 'Salesforce', type: 'CRM', status: 'disconnected' },
  { id: 'int-4', name: 'Slack', type: 'Notifications', status: 'connected', lastSync: days(1) },
];

export const mockApiKeys: ApiKey[] = [
  {
    id: 'key-1',
    name: 'Production API',
    prefix: 'fiq_live_••••',
    createdAt: days(30),
    lastUsed: days(0),
  },
  {
    id: 'key-2',
    name: 'Staging',
    prefix: 'fiq_test_••••',
    createdAt: days(60),
    lastUsed: days(5),
  },
];

export const heatmapData = [
  { day: 'Mon', hour: '9am', value: 12 },
  { day: 'Mon', hour: '12pm', value: 28 },
  { day: 'Mon', hour: '3pm', value: 45 },
  { day: 'Tue', hour: '9am', value: 18 },
  { day: 'Tue', hour: '12pm', value: 52 },
  { day: 'Wed', hour: '3pm', value: 61 },
  { day: 'Thu', hour: '12pm', value: 38 },
  { day: 'Fri', hour: '9am', value: 22 },
];

export const suggestedPrompts = [
  'What are the top churn drivers this week?',
  'Summarize negative billing feedback trends',
  'Which customers have highest complaint volume?',
  'Compare sentiment by product category',
];
