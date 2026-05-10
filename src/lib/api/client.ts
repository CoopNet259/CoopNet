const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'API hatası');
  }
  return res.json() as Promise<T>;
}

// ── Tipler ───────────────────────────────────────────────────

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  current: number;
  capacity: number;
  pct: number;
  tier: 'urgent' | 'warn' | 'good';
  is_critical: boolean;
}

export interface OrderItem {
  id: string;
  customer: string;
  product: string;
  quantity: number;
  unit: string;
  status: string;
  urgency: 'urgent' | 'warn' | 'good';
}

export interface TaskItem {
  id: string;
  title: string;
  done: boolean;
  priority: string;
  role: string;
}

export interface TrendItem {
  name: string;
  delta: string;
  pct: number;
  up: boolean;
}

export interface DashboardSummary {
  date: string;
  kpis: {
    open_orders: number;
    order_trend_pct: number;
    critical_stock: number;
    open_tasks: number;
    harvest_kg_week: number;
  };
  stock: StockItem[];
  orders: OrderItem[];
  tasks: TaskItem[];
  trends: { up: TrendItem[]; down: TrendItem[] };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AgentResult {
  text: string;
  toolCalls: Array<{ tool: string; args: Record<string, unknown>; result: unknown }>;
}

export interface HarvestResult {
  parsed: { product_name: string; quantity: number; unit: string; available_time: string | null; confidence: number };
  stock_status: { current_quantity: number; unit: string; is_critical: boolean; fill_percentage: number };
  recommendation: string;
  actions: string[];
  executed_actions: string[];
  auto_executed: boolean;
  confidence_label: string;
  confidence_warning: string | null;
}

export interface AILogsResponse {
  date: string;
  summary: { total_actions: number; total_alerts: number; danger_count: number; warn_count: number; info_count: number; unread_count: number };
  alerts: Array<{ id: string; level: string; title: string; desc: string; source: string; time: string; is_read: boolean }>;
  actions: Array<{ id: string; time: string; title: string; why: string; ctx: string[]; status: string; confidence: number; impact: string }>;
}

// ── API Fonksiyonları ────────────────────────────────────────

export const getDashboardSummary = () =>
  api<DashboardSummary>('/api/dashboard/summary');

export const postChat = (message: string, history: ChatMessage[] = []) =>
  api<AgentResult>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  });

export const postHarvestAnalyze = (message: string) =>
  api<HarvestResult>('/api/harvest/analyze', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

export const postDailySummary = (date?: string) =>
  api<{ date: string; summary: string; stats: Record<string, number>; critical_items: unknown[]; anomalies: unknown }>('/api/ai/daily-summary', {
    method: 'POST',
    body: JSON.stringify({ date }),
  });

export const postDraftEmail = (product_name: string, quantity: number, unit = 'kg') =>
  api<{ subject: string; body: string; suggested_quantity: number }>('/api/ai/draft-email', {
    method: 'POST',
    body: JSON.stringify({ product_name, quantity, unit }),
  });

export const postDraftNotification = (order_id: string) =>
  api<{ subject: string; message: string; channel: string }>('/api/ai/draft-notification', {
    method: 'POST',
    body: JSON.stringify({ order_id }),
  });

export const getAILogs = (date?: string, limit = 20) => {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  params.set('limit', String(limit));
  return api<AILogsResponse>(`/api/ai/logs?${params}`);
};

export const postWeeklyInsight = (week_start?: string) =>
  api<{
    week_start: string; week_end: string;
    stats: Record<string, unknown>;
    insight: string; highlights: string[];
    recommended_actions: Array<{ tone: string; title: string; meta: string }>;
    week_score: number | null;
  }>('/api/ai/weekly-insight', {
    method: 'POST',
    body: JSON.stringify({ week_start }),
  });
