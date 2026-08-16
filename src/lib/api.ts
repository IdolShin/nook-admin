const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nook_token');
}
function setToken(token: string): void {
  localStorage.setItem('nook_token', token);
  if (typeof document !== 'undefined') {
    document.cookie = 'nook_auth=1; path=/; max-age=31536000; SameSite=Lax';
  }
}
function getBusinessName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('nook_biz') ?? '';
}
function setBusinessName(name: string): void { localStorage.setItem('nook_biz', name); }

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
    // Expired/invalid token: clear session and send the owner back to login
    if (res.status === 401 && typeof window !== 'undefined' && getToken() && !path.startsWith('/api/auth')) {
      localStorage.removeItem('nook_token');
      localStorage.removeItem('nook_biz');
      document.cookie = 'nook_auth=; path=/; max-age=0';
      window.location.href = '/auth';
    }
    const raw = await res.text().catch(() => res.statusText);
    // Keep the machine-readable code (e.g. DAILY_LIMIT_REACHED) on the error
    // so callers can tell "expected refusal" apart from "something broke".
    const err = new Error(raw || String(res.status)) as Error & { code?: string; status?: number };
    err.status = res.status;
    try { err.code = (JSON.parse(raw) as { code?: string }).code; } catch { /* not JSON */ }
    throw err;
  }
  return res.json() as Promise<T>;
}

export interface RewardTier { label: string; points: number }
export interface ApiCard { id: string; name: string; card_type: string; goal_stamps: number; reward_desc: string; reward_tiers?: RewardTier[]; color: string; is_active: boolean; created_at: string; business_id?: string; }
export interface ApiCustomer { id: string; name: string; user_id?: string; unique_key?: string; birthday_mmdd?: string; phone?: string; card_id: string; business_id: string; wallet_type?: string; total_stamps?: number; total_points?: number | null; card_type?: string; created_at: string; }
export interface ApiRedemption { id: string; stamps_redeemed: number | null; points_redeemed: number | null; redeem_type: string; created_at: string; }
export interface BroadcastResult { total_customers?: number; web_push_sent?: number; wallet_updated?: number; failed?: number; scheduled?: boolean; scheduled_for?: string; scheduled_for_et?: string; message?: string; }
export interface ApiAnalytics { taps_30d?: number; active_tags?: number; total_tags?: number; nfc_share_30d?: number; total_customers: number; new_customers_30d: number; new_customers_prev: number; active_cards: number; total_stamps: number; stamps_last_30d: number; stamps_prev_30d: number; total_redemptions: number; redemptions_30d: number; coupons_issued: number; coupons_redeemed: number; stamps_by_day: number[]; stamps_daily_30d?: number[]; redemptions_daily_30d?: number[]; }
export interface ApiReviewConfig { enabled: boolean; reward_type: 'stamp' | 'coupon'; stamp_count: number; coupon_id: string | null; days_to_wait: number; }
export interface ApiReviewPublic { google_review_url: string; reward_enabled: boolean; days_to_wait: number; reward_type: 'stamp' | 'coupon'; stamp_count: number | null; }

export const api = {
  getToken,
  getBusinessName,

  logout: () => {
    localStorage.removeItem('nook_token'); localStorage.removeItem('nook_biz');
    if (typeof document !== 'undefined') document.cookie = 'nook_auth=; path=/; max-age=0';
  },

  googleLogin: async (id_token: string) => {
    const res = await fetch(`${BASE}/api/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_token }) });
    if (!res.ok) { const msg = await res.text().catch(() => res.statusText); throw new Error(msg || String(res.status)); }
    const data = await (res.json() as Promise<{ token: string; business: { id: string; name: string } }>);
    setToken(data.token); setBusinessName(data.business.name); return data;
  },

  login: async (email: string, password: string) => {
    const data = await req<{ token: string; business: { id: string; name: string } }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(data.token); setBusinessName(data.business.name); return data;
  },

  staffLogin: async (email: string, password: string, business_id: string) => {
    const res = await fetch(`${BASE}/api/permissions/staff-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, business_id }) });
    if (!res.ok) { const msg = await res.text().catch(() => res.statusText); throw new Error(msg || String(res.status)); }
    const data = await (res.json() as Promise<{ token: string; business: { id: string; name: string }; staff: { id: string; name: string; role: string } }>);
    setToken(data.token); setBusinessName(data.business.name); return data;
  },

  cards: () => req<{ cards: ApiCard[] }>('/api/cards').then((d) => d.cards),
  createCard: (data: Partial<ApiCard>) => req<{ card: ApiCard }>('/api/cards', { method: 'POST', body: JSON.stringify(data) }).then((d) => d.card),
  updateCard: (id: string, data: Partial<ApiCard>) => req<{ card: ApiCard }>(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then((d) => d.card),
  cardStats: (id: string) => req<{ total_customers: number; total_stamps: number; total_redeems: number }>(`/api/cards/${id}/stats`),
  customers: () => req<{ customers: ApiCustomer[] }>('/api/customers').then((d) => d.customers),
  broadcast: (title: string, body: string) => req<BroadcastResult>('/api/push/broadcast', { method: 'POST', body: JSON.stringify({ message: `${title} — ${body}` }) }),
  coupons: () => req<{ coupons: ApiCoupon[] }>('/api/coupons').then((d) => d.coupons),
  createCoupon: (data: Partial<ApiCoupon>) => req<{ coupon: ApiCoupon }>('/api/coupons', { method: 'POST', body: JSON.stringify(data) }).then((d) => d.coupon),
  updateCoupon: (id: string, data: Partial<ApiCoupon>) => req<{ coupon: ApiCoupon }>(`/api/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then((d) => d.coupon),
  deleteCoupon: (id: string) => req<{ success: boolean }>(`/api/coupons/${id}`, { method: 'DELETE' }),
  deleteCard: (id: string) => req<{ success: boolean }>(`/api/cards/${id}`, { method: 'DELETE' }),
  issueCoupon: (id: string, opts: { customer_ids?: string[]; send_push?: boolean; send_email?: boolean }) => req<{ issued: number; skipped: number; total: number }>(`/api/coupons/${id}/issue`, { method: 'POST', body: JSON.stringify(opts) }),
  redeemStamp: (customerId: string) => req<{ success: boolean; reward_desc: string; message: string }>('/api/scan/redeem', { method: 'POST', body: JSON.stringify({ customer_id: customerId }) }),
  redeemPoints: (customerId: string, points: number, rewardLabel?: string) => req<{ success: boolean; points_spent: number; new_balance: number; message: string }>('/api/scan/redeem-points', { method: 'POST', body: JSON.stringify({ customer_id: customerId, points, reward_label: rewardLabel }) }),
  // ─── Undo mistakes (owner safety net) ────────────────────────
  undoStamp: (opts: { stamp_id?: string; customer_id?: string; count?: number }) =>
    req<{ success: boolean; removed: number; customer_id: string; total_stamps: number; current: number | null; total_points: number | null; goal_stamps: number | null; message: string }>('/api/scan/undo', { method: 'POST', body: JSON.stringify(opts) }),
  undoRedeem: (opts: { redemption_id?: string; customer_id?: string }) =>
    req<{ success: boolean; customer_id: string; undone: string; message: string }>('/api/scan/undo-redeem', { method: 'POST', body: JSON.stringify(opts) }),
  deleteCustomer: (id: string) =>
    req<{ success: boolean; message: string }>(`/api/customers/${id}`, { method: 'DELETE' }),

  customerRedemptions: (customerId: string) => req<{ redemptions: ApiRedemption[] }>(`/api/customers/${customerId}/redemptions`).then((d) => d.redemptions),
  redeemCoupon: (barcode: string) => req<{ success: boolean; coupon: ApiCoupon; customer: { name: string; phone: string }; redeemed_at: string }>('/api/coupons/redeem', { method: 'POST', body: JSON.stringify({ barcode }) }),
  couponPasses: (customerId: string) => req<{ passes: ApiCouponPass[] }>(`/api/coupons/passes/${customerId}`).then((d) => d.passes),
  scanStamp: (code: string, scanType: 'qr' | 'barcode' | 'unique_key' | 'manual' = 'manual') => req<{ success: boolean; stamp_id: string | null; customer_id: string; customer_name: string; card_type: string; reward_desc: string | null; reward_tiers: RewardTier[] | null; points_earned: number | null; total_points: number | null; new_stamps: number | null; goal_stamps: number | null; rewards_earned: number | null; reward_ready: boolean; message: string }>('/api/scan', { method: 'POST', body: JSON.stringify({ code, scan_type: scanType }) }),
  customerLookup: (code: string, type: 'qr' | 'barcode' = 'barcode') => req<{ customer: { id: string; name: string; wallet_type: string; card: { name: string; goal_stamps: number; reward_desc: string }; current_stamps: number; goal_stamps: number; rewards_earned: number } }>(`/api/customers/lookup?code=${encodeURIComponent(code)}&type=${type}`),
  stats: (bizId?: string) => req<{ total_customers: number; active_cards: number; total_stamps: number; total_redemptions: number }>(`/api/stats${bizId ? `?biz_id=${encodeURIComponent(bizId)}` : ''}`),
  analytics: (bizId?: string) => req<ApiAnalytics>(`/api/analytics${bizId ? `?biz_id=${encodeURIComponent(bizId)}` : ''}`),
  updateProfile: (data: { name?: string; owner_email?: string; timezone?: string; region?: string; phone?: string; address?: string }) => req<{ business: { id: string; name: string; owner_email: string; plan: string } }>('/api/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),

  registerCustomer: async (data: { card_id: string; user_id: string; birthday_mmdd?: string; consent_push?: boolean; consent_points?: boolean }): Promise<{ customer: ApiCustomer }> => {
    const res = await fetch(`${BASE}/api/customers/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consent_push: true, consent_points: true, ...data }) });
    if (!res.ok) { let msg = res.statusText; try { const j = await res.json(); msg = j.error ?? j.message ?? msg; } catch (_) {} throw new Error(msg); }
    return res.json();
  },

  // Public business lookup (no auth) — for customer-facing registration pages
  getPublicBusiness: async (slug: string): Promise<{ business: { id: string; name: string; logo_url: string | null; slug: string }; cards: Array<{ id: string; name: string; card_type: string; goal_stamps: number; reward_desc: string; color: string }> }> => {
    const res = await fetch(`${BASE}/api/businesses/public/${encodeURIComponent(slug)}`);
    if (!res.ok) { let msg = res.statusText; try { const j = await res.json(); msg = j.error ?? j.message ?? msg; } catch (_) {} throw new Error(msg); }
    return res.json();
  },

  getBusinesses: async (): Promise<Array<{ id: string; name: string }>> => {
    const token = getToken();
    const res = await fetch(`${BASE}/api/businesses`, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
    if (!res.ok) throw new Error('Failed to fetch businesses');
    return res.json();
  },

  listBusinesses: () => req<{ businesses: ApiBusiness[] }>('/api/permissions/businesses').then((d) => d.businesses),
  updateBusinessPermissions: (id: string, page_permissions: Record<string, string>) => req<{ business: ApiBusiness }>(`/api/permissions/businesses/${id}`, { method: 'PATCH', body: JSON.stringify({ page_permissions }) }).then((d) => d.business),
  listStaff: () => req<{ users: ApiStaffUser[] }>('/api/permissions/users').then((d) => d.users),
  createStaff: (data: { email: string; name: string; role: string; password: string; page_permissions?: Record<string, string> }) => req<{ user: ApiStaffUser }>('/api/permissions/users', { method: 'POST', body: JSON.stringify(data) }).then((d) => d.user),
  updateStaff: (id: string, data: Partial<{ name: string; role: string; page_permissions: Record<string, string>; is_active: boolean; password: string }>) => req<{ user: ApiStaffUser }>(`/api/permissions/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then((d) => d.user),
  deleteStaff: (id: string) => req<{ success: boolean }>(`/api/permissions/users/${id}`, { method: 'DELETE' }),
  listBusinessUsers: (bizId: string) => req<{ users: ApiStaffUser[] }>(`/api/permissions/businesses/${bizId}/users`).then((d) => d.users),
  createBusinessUser: (bizId: string, data: { email: string; name: string; role: string; password: string; page_permissions?: Record<string, string> }) => req<{ user: ApiStaffUser }>(`/api/permissions/businesses/${bizId}/users`, { method: 'POST', body: JSON.stringify(data) }).then((d) => d.user),
  updateBusinessUser: (bizId: string, uid: string, data: Partial<{ name: string; role: string; page_permissions: Record<string, string>; is_active: boolean; password: string }>) => req<{ user: ApiStaffUser }>(`/api/permissions/businesses/${bizId}/users/${uid}`, { method: 'PATCH', body: JSON.stringify(data) }).then((d) => d.user),
  deleteBusinessUser: (bizId: string, uid: string) => req<{ success: boolean }>(`/api/permissions/businesses/${bizId}/users/${uid}`, { method: 'DELETE' }),

  // Google Review Rewards
  getReviewConfig: () => req<{ google_review_url: string; review_reward_config: ApiReviewConfig }>('/api/reviews/config'),
  updateReviewConfig: (data: { google_review_url?: string; review_reward_config?: Partial<ApiReviewConfig> }) => req<{ google_review_url: string; review_reward_config: ApiReviewConfig }>('/api/reviews/config', { method: 'PATCH', body: JSON.stringify(data) }),
  getReviewPublic: (businessId: string) => req<ApiReviewPublic>(`/api/reviews/public/${encodeURIComponent(businessId)}`),
  initiateReview: async (customerId: string, businessId: string): Promise<{ success: boolean; reward_at: string; days_to_wait: number; message: string }> => {
    const res = await fetch(`${BASE}/api/reviews/initiate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_id: customerId, business_id: businessId }) });
    if (!res.ok) { let msg = res.statusText; try { const j = await res.json(); msg = j.error ?? j.message ?? msg; } catch (_) {} throw new Error(msg); }
    return res.json();
  },

  // ─── NFC Tap-to-Collect (public, no auth) ───────────────────
  tapVerify: async (params: { picc_data?: string; cmac?: string; uid?: string; ctr?: string }): Promise<TapVerifyResult> => {
    const res = await fetch(`${BASE}/api/tap/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(j.error ?? res.statusText) as Error & { code?: string }; e.code = j.code; throw e; }
    return j;
  },
  tapCollect: async (tap_token: string, unique_key?: string, account_token?: string): Promise<TapCollectResult> => {
    const res = await fetch(`${BASE}/api/tap/collect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tap_token, ...(unique_key ? { unique_key } : {}), ...(account_token ? { account_token } : {}) }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(j.error ?? res.statusText) as Error & { code?: string }; e.code = j.code; throw e; }
    return j;
  },

  // ─── NFC Tag management (business auth) ──────────────────────
  listTags: () => req<{ tags: ApiNfcTag[] }>('/api/tags').then((d) => d.tags),
  createTag: (data: { name: string; uid: string; meta_key?: string; file_key?: string; tag_mode?: 'sdm' | 'basic' }) => req<{ tag: ApiNfcTag }>('/api/tags', { method: 'POST', body: JSON.stringify(data) }).then((d) => d.tag),
  updateTag: (id: string, data: Partial<{ name: string; is_active: boolean }>) => req<{ tag: ApiNfcTag }>(`/api/tags/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then((d) => d.tag),
  deleteTag: (id: string) => req<{ success: boolean }>(`/api/tags/${id}`, { method: 'DELETE' }),

  // ─── Store location (proximity features) ─────────────────────
  getLocation: () => req<{ address: string; lat: number | null; lng: number | null; tap_promo: string; daily_stamp_limit: number | null }>('/api/location'),
  geocodeAddress: (address: string) => req<{ results: Array<{ lat: number; lng: number; display_name: string }> }>('/api/location/geocode', { method: 'POST', body: JSON.stringify({ address }) }).then((d) => d.results),
  saveLocation: (data: { lat?: number; lng?: number; address?: string; tap_promo?: string; daily_stamp_limit?: number | null }) => req<{ business: { id: string; name: string; address: string | null; lat: number; lng: number; daily_stamp_limit: number | null } }>('/api/location', { method: 'PATCH', body: JSON.stringify(data) }),

  // ─── Customer wallet view (public) ───────────────────────────
  redeemPointsPublic: async (unique_key: string, points: number, reward_label?: string): Promise<{ success: boolean; points_spent: number; new_balance: number; reward_label: string | null; business_name: string; customer_name: string; redeemed_at: string }> => {
    const res = await fetch(`${BASE}/api/tap/redeem-points`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unique_key, points, reward_label }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(j.error ?? res.statusText) as Error & { code?: string }; e.code = j.code; throw e; }
    return j;
  },
  redeemReward: async (unique_key: string): Promise<{ success: boolean; reward_desc: string; business_name: string; customer_name: string; redeemed_at: string; remaining_rewards: number }> => {
    const res = await fetch(`${BASE}/api/tap/redeem-reward`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unique_key }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(j.error ?? res.statusText) as Error & { code?: string }; e.code = j.code; throw e; }
    return j;
  },
  walletCards: async (keys: string[]): Promise<{ cards: WalletCard[]; not_found: string[] }> => {
    const res = await fetch(`${BASE}/api/tap/wallet`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keys }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error ?? res.statusText);
    return j;
  },
};

export interface ApiBusiness { id: string; name: string; owner_email: string; plan: string; is_superadmin: boolean; page_permissions: Record<string, string> | null; created_at: string; }
export interface ApiStaffUser { id: string; email: string; name: string; role: 'viewer' | 'editor' | 'admin'; page_permissions: Record<string, string>; is_active: boolean; created_at: string; }
export interface ApiCoupon { id: string; title: string; name?: string; description?: string; coupon_type: 'percent' | 'fixed' | 'bogo' | 'free_item'; discount_type?: 'percent' | 'fixed'; discount_value?: number; free_item_name?: string; trigger_type: string; trigger_config?: Record<string, unknown>; valid_days?: number; expires_at?: string | null; is_active: boolean; color?: string; terms?: string; max_redemptions?: number | null; total_issued?: number; total_redeemed?: number; created_at: string; }
export interface ApiCouponPass { id: string; coupon_id: string; customer_id: string; barcode: string; status: 'active' | 'used' | 'expired'; issued_at: string; expires_at: string | null; redeemed_at?: string | null; wallet_link?: string | null; coupons?: { id: string; title: string; color?: string; coupon_type?: string; description?: string; discount_value?: number; free_item_name?: string } | null; }
export interface ApiNfcTag { id: string; name: string; uid: string; last_ctr: number; is_active: boolean; created_at: string; taps_30d?: number; last_tap_at?: string | null; tag_mode?: 'sdm' | 'basic'; cooldown_sec?: number; }
export interface TapVerifyResult { valid: boolean; mode?: 'sdm' | 'basic'; tap_token: string; tag_name: string | null; business: { id: string; name: string; logo_url: string | null }; cards: Array<{ id: string; name: string; card_type: string; goal_stamps: number; reward_desc: string; color: string }>; }
export interface TapCollectResult { success: boolean; customer_id: string; customer_name: string; user_id: string | null; unique_key: string | null; business_name: string; card_name: string | null; card_color: string | null; card_type: string; reward_desc: string | null; points_earned: number | null; total_points: number | null; prev_stamps: number | null; new_stamps: number | null; goal_stamps: number | null; rewards_earned: number | null; reward_ready: boolean; welcome_coupon: { title: string; barcode: string; expires_at: string } | null; next_visit_free: boolean; tap_promo: string | null; review: { url: string; reward_label: string } | null; }
export interface WalletCoupon { id: string; barcode: string; status: string; expires_at: string | null; title: string; discount_type: string | null; discount_value: number | null; free_item_name: string | null; }
export interface WalletCard { unique_key: string; user_id: string | null; business: { id: string; name: string; logo_url: string | null; lat?: number | null; lng?: number | null } | null; card_name: string; card_type: string; color: string; goal_stamps: number | null; current_stamps: number | null; total_stamps: number; total_points: number | null; reward_desc: string | null; reward_tiers: RewardTier[] | null; rewards_earned: number; rewards_redeemed: number; reward_ready: boolean; coupons: WalletCoupon[]; last_visit: string | null; joined_at: string; }
