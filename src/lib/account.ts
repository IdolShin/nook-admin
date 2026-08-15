// ─── Customer account session (wallet users) ─────────────────
// One login → your cards follow you to any device.
// Token is long-lived (1 year) so customers never log in twice.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
const TOKEN_KEY = 'nook_customer_token';
const ACC_KEY = 'nook_customer_account';

export interface CustomerAccount {
  id: string;
  email: string | null;
  name: string | null;
  birthday_mmdd: string | null;
  avatar_url: string | null;
}

export function getAccountToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function getAccount(): CustomerAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACC_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveSession(token: string, account: CustomerAccount) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ACC_KEY, JSON.stringify(account));
  } catch { /* non-fatal */ }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACC_KEY);
  } catch { /* non-fatal */ }
}

async function post<T>(path: string, body: unknown, auth = false): Promise<T> {
  const token = auth ? getAccountToken() : null;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(j.error ?? res.statusText) as Error & { code?: string };
    e.code = j.code;
    throw e;
  }
  return j as T;
}

type AuthResult = { token: string; account: CustomerAccount };

export const account = {
  register: async (data: { email: string; password: string; name?: string; birthday_mmdd?: string }) => {
    const r = await post<AuthResult>('/api/account/register', data);
    saveSession(r.token, r.account);
    return r;
  },

  login: async (email: string, password: string) => {
    const r = await post<AuthResult>('/api/account/login', { email, password });
    saveSession(r.token, r.account);
    return r;
  },

  google: async (id_token: string) => {
    const r = await post<AuthResult>('/api/account/google', { id_token });
    saveSession(r.token, r.account);
    return r;
  },

  /** Account info + every card key on this account */
  me: async (): Promise<{ account: CustomerAccount; keys: string[] } | null> => {
    const token = getAccountToken();
    if (!token) return null;
    const res = await fetch(`${BASE}/api/account/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { clearSession(); return null; }
    if (!res.ok) return null;
    const j = await res.json();
    try { localStorage.setItem(ACC_KEY, JSON.stringify(j.account)); } catch { /* non-fatal */ }
    return j;
  },

  /** Attach a device-only card (by card number) to this account */
  link: (unique_key: string) => post<{ success: boolean; unique_key: string }>('/api/account/link', { unique_key }, true),

  /** Join a new store straight onto this account */
  join: (card_id: string) => post<{ unique_key: string; existing: boolean }>('/api/account/join', { card_id }, true),
};
