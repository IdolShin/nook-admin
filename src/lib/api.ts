const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nook_token');
}

function setToken(token: string): void {
  localStorage.setItem('nook_token', token);
}

function getBusinessName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('nook_biz') ?? '';
}

function setBusinessName(name: string): void {
  localStorage.setItem('nook_biz', name);
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || String(res.status));
  }
  return res.json() as Promise<T>;
}

export interface ApiCard {
  id: string;
  name: string;
  card_type: string;
  goal_stamps: number;
  reward_desc: string;
  color: string;
  is_active: boolean;
}

export interface ApiCustomer {
  id: string;
  name: string;
  phone: string;
  card_id: string;
  business_id: string;
  wallet_type?: string;
  total_stamps?: number;
  created_at: string;
}

export interface BroadcastResult {
  total_customers: number;
  web_push_sent: number;
  wallet_updated: number;
  failed: number;
}

export const api = {
  getToken,
  getBusinessName,

  login: async (email: string, password: string) => {
    const data = await req<{ token: string; business: { id: string; name: string } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    setToken(data.token);
    setBusinessName(data.business.name);
    return data;
  },

  cards: () => req<{ cards: ApiCard[] }>('/api/cards').then((d) => d.cards),

  createCard: (data: Partial<ApiCard>) =>
    req<{ card: ApiCard }>('/api/cards', { method: 'POST', body: JSON.stringify(data) }).then((d) => d.card),

  updateCard: (id: string, data: Partial<ApiCard>) =>
    req<{ card: ApiCard }>(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then((d) => d.card),

  cardStats: (id: string) =>
    req<{ total_customers: number; total_stamps: number; total_redeems: number }>(`/api/cards/${id}/stats`),

  customers: () => req<{ customers: ApiCustomer[] }>('/api/customers').then((d) => d.customers),

  broadcast: (title: string, body: string) =>
    req<BroadcastResult>('/api/push/broadcast', {
      method: 'POST',
      body: JSON.stringify({ message: `${title} — ${body}` }),
    }),

  coupons: () => req<{ coupons: ApiCoupon[] }>('/api/coupons').then((d) => d.coupons),

  createCoupon: (data: Partial<ApiCoupon>) =>
    req<{ coupon: ApiCoupon }>('/api/coupons', { method: 'POST', body: JSON.stringify(data) }).then((d) => d.coupon),

  updateCoupon: (id: string, data: Partial<ApiCoupon>) =>
    req<{ coupon: ApiCoupon }>(`/api/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then((d) => d.coupon),

  issueCoupon: (id: string, opts: { customer_ids?: string[]; send_push?: boolean; send_email?: boolean }) =>
    req<{ issued: number; skipped: number; total: number }>(`/api/coupons/${id}/issue`, {
      method: 'POST', body: JSON.stringify(opts),
    }),

  redeemCoupon: (barcode: string) =>
    req<{ success: boolean; coupon: ApiCoupon; customer: { name: string; phone: string }; redeemed_at: string }>(
      '/api/coupons/redeem', { method: 'POST', body: JSON.stringify({ barcode }) }
    ),

  couponPasses: (customerId: string) =>
    req<{ passes: ApiCouponPass[] }>(`/api/coupons/passes/${customerId}`).then((d) => d.passes),
};

export interface ApiCoupon {
  id: string;
  title: string;
  description?: string;
  coupon_type: string;
  discount_value?: number;
  free_item_name?: string;
  terms?: string;
  trigger_type: string;
  trigger_config?: Record<string, unknown>;
  max_redemptions?: number;
  total_issued: number;
  total_redeemed: number;
  valid_days: number;
  expires_at?: string;
  is_active: boolean;
  color: string;
  created_at: string;
}

export interface ApiCouponPass {
  id: string;
  barcode: string;
  status: 'active' | 'redeemed' | 'expired';
  issued_at: string;
  expires_at: string;
  redeemed_at?: string;
  wallet_link?: string;
  coupons?: ApiCoupon;
  customers?: { id: string; name: string; phone: string };
}
