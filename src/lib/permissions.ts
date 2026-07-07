// ─── Permission types ─────────────────────────────────────────
export type PermLevel = 'none' | 'view' | 'edit' | 'admin';

export type PageKey =
  | 'dashboard' | 'cards' | 'customers' | 'push'
  | 'analytics' | 'coupons' | 'settings' | 'scanner';

export type PagePermissions = Record<PageKey, PermLevel>;

export const ALL_PAGES: { key: PageKey; label: string; href: string }[] = [
  { key: 'dashboard',  label: 'Dashboard',           href: '/dashboard' },
  { key: 'cards',      label: 'Loyalty Cards',        href: '/cards' },
  { key: 'customers',  label: 'Customers',            href: '/customers' },
  { key: 'push',       label: 'Push Notifications',  href: '/push' },
  { key: 'analytics',  label: 'Analytics',            href: '/analytics' },
  { key: 'coupons',    label: 'Coupons',              href: '/coupons' },
  { key: 'settings',   label: 'Settings',             href: '/settings' },
  { key: 'scanner',    label: 'Collect',              href: '/scan' },
];

export const LEVEL_ORDER: PermLevel[] = ['none', 'view', 'edit', 'admin'];
export const LEVEL_LABELS: Record<PermLevel, string> = {
  none:  'None',
  view:  'View',
  edit:  'Edit',
  admin: 'Admin',
};
export const LEVEL_COLORS: Record<PermLevel, { bg: string; color: string }> = {
  none:  { bg: '#F0F1F4', color: '#5C5F66' },
  view:  { bg: '#E2ECFB', color: '#1F4E94' },
  edit:  { bg: '#FBF0E2', color: '#8C5A11' },
  admin: { bg: '#E8F7F2', color: '#085041' },
};

export const DEFAULT_OWNER_PERMS: PagePermissions = {
  dashboard: 'admin', cards: 'admin', customers: 'admin', push: 'admin',
  analytics: 'admin', coupons: 'admin', settings: 'admin', scanner: 'admin',
};

export const DEFAULT_STAFF_PERMS: PagePermissions = {
  dashboard: 'view', cards: 'none', customers: 'view', push: 'none',
  analytics: 'view', coupons: 'none', settings: 'none', scanner: 'view',
};

export const ROLE_PRESETS: Record<string, PagePermissions> = {
  viewer: {
    dashboard: 'view', cards: 'view', customers: 'view', push: 'none',
    analytics: 'view', coupons: 'view', settings: 'none', scanner: 'view',
  },
  editor: {
    dashboard: 'view', cards: 'edit', customers: 'edit', push: 'edit',
    analytics: 'view', coupons: 'edit', settings: 'none', scanner: 'edit',
  },
  admin: {
    dashboard: 'admin', cards: 'admin', customers: 'admin', push: 'admin',
    analytics: 'admin', coupons: 'admin', settings: 'admin', scanner: 'admin',
  },
};

// ─── JWT decode (client-side, no verification) ───────────────
export interface DecodedToken {
  id: string;
  email: string;
  name: string;
  plan: string;
  is_superadmin: boolean;
  is_staff?: boolean;
  staff_role?: string;
  page_permissions: PagePermissions | null;
}

export function decodeToken(): DecodedToken | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('nook_token');
  if (!raw) return null;
  try {
    const payload = raw.split('.')[1];
    return JSON.parse(atob(payload)) as DecodedToken;
  } catch {
    return null;
  }
}

// ─── Permission check helpers ─────────────────────────────────
export function getPagePermission(decoded: DecodedToken | null, page: PageKey): PermLevel {
  if (!decoded) return 'none';
  if (decoded.is_superadmin) return 'admin';
  if (!decoded.page_permissions) return 'admin';  // owner with no explicit perms = full
  return decoded.page_permissions[page] ?? 'none';
}

export function canView(decoded: DecodedToken | null, page: PageKey): boolean {
  const lvl = getPagePermission(decoded, page);
  return LEVEL_ORDER.indexOf(lvl) >= LEVEL_ORDER.indexOf('view');
}

export function canEdit(decoded: DecodedToken | null, page: PageKey): boolean {
  const lvl = getPagePermission(decoded, page);
  return LEVEL_ORDER.indexOf(lvl) >= LEVEL_ORDER.indexOf('edit');
}

export function canAdmin(decoded: DecodedToken | null, page: PageKey): boolean {
  const lvl = getPagePermission(decoded, page);
  return lvl === 'admin';
}
