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
  actions: Array<{ id: string; time: string; title: string; why: string; ctx: string[]; status: string; impact: string }>;
}

// ── API Fonksiyonları ────────────────────────────────────────

export const getDashboardSummary = () =>
  api<DashboardSummary>('/api/dashboard/summary');

export const patchTask = (task_id: string, done: boolean) =>
  api<{ id: string; done: boolean }>(`/api/dashboard/tasks/${task_id}`, {
    method: 'PATCH',
    body: JSON.stringify({ done }),
  });

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

export interface ProducerItem {
  id: number;
  ad: string;
  lokasyon: string;
  urunler: string[];
  kapasite: string;
  karsilama?: string;
  puan?: number;
  avatar: string;
  ihtiyac?: string;
  type: 'talep' | 'kardes' | 'genel';
}

export interface AnomalyItem {
  id: string;
  title: string;
  description: string;
  severity: 'kritik' | 'yuksek' | 'orta' | 'bilgi';
  category: string;
  source: string;
  recommendation: string;
}

export interface AIReportItem {
  id: number;
  baslik: string;
  maddeler: string;
}

export const getProducers = () =>
  api<ProducerItem[]>('/api/producers');

export const getAnomalySummary = (date?: string) => {
  const params = new URLSearchParams();
  if (date) params.set('target_date', date);
  return api<{ date: string; anomalies: AnomalyItem[] }>(`/api/anomaly/summary?${params}`);
};

export const getAIReports = () =>
  api<AIReportItem[]>('/api/ai/reports');

// ── Ajan Kararları ────────────────────────────────────────────

export interface AgentDecisionItem {
  id: number;
  ajan: string;
  ajan_label: string;
  ajan_icon: string;
  karar: string;
  karar_label: string;
  aciklama: string;
  tetikleyen: string;
  meta: Record<string, unknown>;
  saat: string;
  tarih: string;
  raw_time: string;
}

export interface AgentDecisionsResponse {
  total: number;
  items: AgentDecisionItem[];
}

export const getAgentDecisions = (limit = 50) =>
  api<AgentDecisionsResponse>(`/api/ai/decisions?limit=${limit}`);

export interface WhatsAppDemoResult {
  reply: string;
  results: Array<{
    product: string;
    quantity: number;
    needed: number;
    decision: 'otomatik_kabul' | 'ihtiyac_yok' | 'onay_bekleniyor';
    fill_pct: number;
    reply_line: string;
  }>;
  error?: string;
}

export interface HarvestMessagesResponse {
  messages: Array<{
    id: string;
    time: string;
    message: string;
    impact: string;
    source: string;
  }>;
  tasks: Array<{
    id: number;
    title: string;
    done: boolean;
    priority: string;
  }>;
}

export const getHarvestMessages = (limit = 20) =>
  api<HarvestMessagesResponse>(`/api/harvest/messages?limit=${limit}`);

// ── Onay Kuyruğu ────────────────────────────────────────────

export interface PendingApproval {
  id: number;
  uretici_telefon: string;
  uretici_adi: string;
  urun_adi: string;
  talep_miktari: number;
  kabul_miktari: number;
  birim: string;
  stok_doluluk: number;
  ham_mesaj: string;
  durum: 'bekliyor' | 'onaylandi' | 'reddedildi' | 'zaman_asimi';
  olusturuldu: string;
}

export interface ApprovalActionResult {
  status: string;
  approval_id: number;
  task_id?: string;
  message?: string;
  whatsapp_reply: string;
}

export const getAllStock = () =>
  api<StockItem[]>('/api/dashboard/stock/all');

export const getApprovals = () =>
  api<PendingApproval[]>('/api/approvals');

export const approveRequest = (id: number) =>
  api<ApprovalActionResult>(`/api/approvals/${id}/approve`, { method: 'POST' });

export const rejectRequest = (id: number) =>
  api<ApprovalActionResult>(`/api/approvals/${id}/reject`, { method: 'POST' });

// ── İsraf Önleme ─────────────────────────────────────────────

export interface WasteSisterProducer {
  id: string;
  ad: string;
  lokasyon: string;
  telefon: string;
  avatar: string;
}

export interface WasteRiskItem {
  id: string;
  urun: string;
  emoji: string;
  mevcut_kg: number;
  days_left: number;
  surplus_kg: number;
  daily_est_kg: number;
  alis_fiyati: number | null;
  kategori: string;
  kardesler: WasteSisterProducer[];
}

export interface WasteRiskResponse {
  scanned_at: string;
  total_at_risk: number;
  items: WasteRiskItem[];
}

// ── Talep Trendleri ───────────────────────────────────────────

export interface DemandTrendItem {
  name: string;
  delta: string;
  pct: number;
  up: boolean;
  this_week_kg: number;
  last_week_kg: number;
}

export interface DemandTrendsResponse {
  date: string;
  up: DemandTrendItem[];
  down: DemandTrendItem[];
}

export const getWasteRisk = () =>
  api<WasteRiskResponse>('/api/waste-prevention/scan');

export const testWhatsApp = () =>
  api<{ status: string; to: string; message_sid: string; message: string }>('/api/waste-prevention/test-whatsapp');

export const getDemandTrends = () =>
  api<DemandTrendsResponse>('/api/dashboard/trends');

export const sendWasteOffer = (urun_adi: string, surplus_kg: number, days_left: number) =>
  api<{ status: string; sent_count: number; message: string }>('/api/waste-prevention/send-offer', {
    method: 'POST',
    body: JSON.stringify({ urun_adi, surplus_kg, days_left }),
  });

export const createWasteTask = (urun_adi: string, surplus_kg: number, days_left: number) =>
  api<{ status: string; task_id?: string; message: string }>('/api/waste-prevention/create-task', {
    method: 'POST',
    body: JSON.stringify({ urun_adi, surplus_kg, days_left }),
  });

export const postWhatsAppDemo = (message: string, profileName = 'Demo Üretici') => {
  const form = new URLSearchParams();
  form.set('Body', message);
  form.set('ProfileName', profileName);
  return api<WhatsAppDemoResult>('/api/webhook/whatsapp/demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
};

// ── Vardiye & Personel ───────────────────────────────────────────

export interface Employee {
  id: number;
  ad: string;
  telefon?: string;
  departman: string;
  departman_label: string;
  dept_color: string;
  rol: string;
  avatar_emoji: string;
  aktif: boolean;
}

export interface ShiftEntry {
  shift_id: number;
  employee_id: number;
  ad: string;
  avatar: string;
  rol: string;
  telefon?: string;
  vardiye: string;
  vardiye_label: string;
  vardiye_color: string;
  baslangic: string;
  bitis: string;
  notlar?: string;
}

export interface ScheduleDay {
  date: string;
  day_name: string;
  is_today: boolean;
  is_weekend: boolean;
  shifts: Record<string, ShiftEntry[]>;
  total: number;
}

export interface ScheduleResponse {
  week_start: string;
  week_end: string;
  days: ScheduleDay[];
}

export interface OnDutyEntry extends ShiftEntry {
  departman: string;
  departman_label: string;
  dept_color: string;
}

export interface TaskWithAssignee {
  id: number;
  is_name: string;
  durum: boolean;
  oncelik: string;
  departman?: string;
  aciklama?: string;
  created_at?: string;
  assigned_to?: number;
  assigned_name?: string;
  assigned_avatar?: string;
  assigned_rol?: string;
}

export const getEmployees = (departman?: string) =>
  api<{ employees: Employee[] }>(`/api/shifts/employees${departman ? `?departman=${departman}` : ''}`);

export const getShiftSchedule = (week?: string) =>
  api<ScheduleResponse>(`/api/shifts/schedule${week ? `?week=${week}` : ''}`);

export const getOnDuty = (departman?: string) =>
  api<{ date: string; time: string; on_duty: OnDutyEntry[] }>(`/api/shifts/on-duty${departman ? `?departman=${departman}` : ''}`);

export const getTasksWithAssignees = () =>
  api<{ tasks: TaskWithAssignee[] }>('/api/shifts/tasks');

export const createShift = (body: {
  employee_id: number; tarih: string; vardiye_turu: string;
  baslangic: string; bitis: string; departman: string; notlar?: string;
}) => api<{ ok: boolean }>('/api/shifts/', { method: 'POST', body: JSON.stringify(body) });

export const deleteShift = (shift_id: number) =>
  api<{ ok: boolean }>(`/api/shifts/${shift_id}`, { method: 'DELETE' });

// ── Notifications ─────────────────────────────────────────────
export interface Notification {
  id: string;
  icon: string;
  text: string;
  time: string;
  severity: 'kritik' | 'yuksek' | 'orta';
  category: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

export const getNotifications = () =>
  api<NotificationsResponse>('/api/notifications');

// ── AI Dashboard Brief ────────────────────────────────────────
export interface DashboardBrief {
  date: string;
  bullets: string[];
  cached: boolean;
}

export const getDashboardBrief = () =>
  api<DashboardBrief>('/api/ai/dashboard-brief');
