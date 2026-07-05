'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, ChevronDown, ChevronRight, AlertTriangle, Check, Eye, EyeOff, Shield, Users, Briefcase, CreditCard, Zap, MapPin, LocateFixed } from 'lucide-react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { api, type ApiBusiness, type ApiStaffUser } from '@/lib/api';
import { decodeToken } from '@/lib/permissions';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

// ─── Integrations data ─────────────────────────────────────────
const INTEGRATIONS = [
  { n: 'Google Wallet', d: 'Issue passes to Android users',    ok: true,  note: '' },
  { n: 'Apple Wallet',  d: 'Issue passes to iOS users',        ok: false, note: 'Apple Developer account required ($99/yr)' },
  { n: 'Resend',        d: 'Transactional email delivery',     ok: false, note: 'API key not configured in Railway env' },
  { n: 'Web Push',      d: 'Browser push notifications',       ok: true,  note: '' },
  { n: 'Stripe',        d: 'Subscription billing',             ok: false, note: 'Not yet integrated' },
  { n: 'Twilio',        d: 'SMS fallback notifications',       ok: false, note: 'Not yet integrated' },
];

const ALERT_COUNT = INTEGRATIONS.filter((i) => !i.ok).length;

// ─── Helpers ───────────────────────────────────────────────────
function monthsActive(createdAt: string): number {
  const start = new Date(createdAt);
  const now = new Date();
  return Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
}

function planBadge(plan: string) {
  const MAP: Record<string, { label: string; bg: string; color: string }> = {
    basic:   { label: 'Basic',   bg: '#F0F1F4', color: '#5C5F66' },
    pro:     { label: 'Pro',     bg: '#E2ECFB', color: '#1F4E94' },
    premium: { label: 'Premium', bg: '#E8F7F2', color: '#085041' },
    starter: { label: 'Starter', bg: '#F5F6FA', color: '#8A8D94' },
    trial:   { label: 'Trial',   bg: '#FBF0E2', color: '#8C5A11' },
  };
  const m = MAP[plan?.toLowerCase()] ?? MAP.starter;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

// ─── Staff row ─────────────────────────────────────────────────
function StaffRow({
  user, bizId, onUpdated, onDeleted,
}: {
  user: ApiStaffUser; bizId: string;
  onUpdated: (u: ApiStaffUser) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<string>(user.role);
  const [active, setActive] = useState(user.is_active);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const updates: Record<string, unknown> = { name, role, is_active: active };
      if (password) updates.password = password;
      const updated = await api.updateBusinessUser(bizId, user.id, updates);
      onUpdated(updated);
      setEditing(false);
      setPassword('');
      toast('Account updated', 'success');
    } catch { toast('Failed to update', 'error'); }
    setSaving(false);
  }

  async function del() {
    if (!confirm(`Delete ${user.email}?`)) return;
    try {
      await api.deleteBusinessUser(bizId, user.id);
      onDeleted(user.id);
      toast('Account deleted', 'success');
    } catch { toast('Failed to delete', 'error'); }
  }

  const inputStyle: React.CSSProperties = {
    height: 30, padding: '0 8px', fontSize: 12, fontFamily: 'inherit',
    border: '1px solid #EBEBEB', borderRadius: 6, outline: 'none',
    background: 'white', color: '#1A1A1F',
  };

  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid #F5F5F5' }}>
      {!editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 999, flexShrink: 0,
            background: role === 'admin' ? '#1D9E75' : '#8A8D94',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700,
          }}>
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{user.name}</div>
            <div style={{ fontSize: 11, color: '#8A8D94', fontFamily: 'var(--font-mono)' }}>{user.email}</div>
          </div>
          <span style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 999,
            background: role === 'admin' ? '#E8F7F2' : '#F0F1F4',
            color: role === 'admin' ? '#085041' : '#5C5F66',
          }}>{role}</span>
          {!user.is_active && (
            <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: '#FBE2EC', color: '#9C2848' }}>Inactive</span>
          )}
          <button onClick={() => setEditing(true)} style={{ height: 26, padding: '0 8px', border: '1px solid #EBEBEB', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', color: '#5C5F66' }}>Edit</button>
          <button onClick={del} style={{ height: 26, padding: '0 8px', border: '1px solid #F0D5DC', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', color: '#9C2848' }}>Delete</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: '#F9FAFB', borderRadius: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...inputStyle, paddingRight: 4 }}>
              <option value="viewer">viewer</option>
              <option value="admin">admin</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5C5F66', cursor: 'pointer' }}>
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active
            </label>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (leave blank to keep)"
              style={{ ...inputStyle, flex: 1, paddingRight: 32 }}
            />
            <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 8, border: 0, background: 'transparent', cursor: 'pointer', color: '#8A8D94', padding: 0, display: 'flex' }}>
              {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={save} disabled={saving} style={{ height: 28, padding: '0 12px', background: '#1D9E75', color: 'white', border: 0, borderRadius: 6, fontSize: 12, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setEditing(false); setPassword(''); }} style={{ height: 28, padding: '0 10px', border: '1px solid #EBEBEB', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', color: '#5C5F66' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Create staff form ─────────────────────────────────────────
function CreateStaffForm({ bizId, onCreated, onCancel }: {
  bizId: string; onCreated: (u: ApiStaffUser) => void; onCancel: () => void;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('viewer');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!email || !name || !password) { toast('All fields required', 'error'); return; }
    setSaving(true);
    try {
      const user = await api.createBusinessUser(bizId, { email, name, role, password });
      onCreated(user);
      toast('Account created', 'success');
    } catch (e: unknown) {
      toast((e as Error).message || 'Failed to create', 'error');
    }
    setSaving(false);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit',
    border: '1px solid #EBEBEB', borderRadius: 8, outline: 'none', background: 'white',
    color: '#1A1A1F', boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: 14, background: '#F0FAF6', borderRadius: 10, marginTop: 8, display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#085041' }}>New account</div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={inputStyle} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" style={inputStyle} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ ...inputStyle, paddingRight: 32 }} />
          <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'transparent', cursor: 'pointer', color: '#8A8D94', padding: 0, display: 'flex' }}>
            {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} style={{ height: 36, padding: '0 8px', border: '1px solid #EBEBEB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: 'white', color: '#1A1A1F' }}>
          <option value="viewer">viewer</option>
          <option value="admin">admin</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={save} disabled={saving} style={{ height: 34, padding: '0 14px', background: '#1D9E75', color: 'white', border: 0, borderRadius: 8, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {saving ? 'Creating…' : 'Create account'}
        </button>
        <button onClick={onCancel} style={{ height: 34, padding: '0 12px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', color: '#5C5F66' }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Business card ─────────────────────────────────────────────
function BizCard({ biz }: { biz: ApiBusiness }) {
  const [expanded, setExpanded] = useState(false);
  const [users, setUsers] = useState<ApiStaffUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const months = monthsActive(biz.created_at);
  const joinedDate = new Date(biz.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  async function loadUsers() {
    if (users.length > 0) return;
    setLoadingUsers(true);
    try {
      const data = await api.listBusinessUsers(biz.id);
      setUsers(data);
    } catch { /* ignore */ }
    setLoadingUsers(false);
  }

  function toggle() {
    setExpanded(!expanded);
    if (!expanded) loadUsers();
  }

  return (
    <div style={{ borderTop: '1px solid #EBEBEB', paddingTop: 16, marginTop: 4 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: '#1D9E75', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em',
        }}>
          {biz.name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{biz.name}</span>
            {planBadge(biz.plan)}
            {biz.is_superadmin && (
              <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: '#E8F7F2', color: '#085041', fontWeight: 600 }}>Operator</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#8A8D94', marginTop: 3 }}>
            {biz.owner_email} {String.fromCharCode(183)} Joined {joinedDate} {String.fromCharCode(183)} {months === 0 ? 'Less than a month' : `${months} month${months !== 1 ? 's' : ''} active`}
          </div>
        </div>
        <button
          onClick={toggle}
          style={{ display: 'flex', alignItems: 'center', gap: 4, height: 30, padding: '0 10px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', color: '#5C5F66' }}
        >
          <Users size={13} />
          Accounts
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
      </div>

      {/* Expanded accounts */}
      {expanded && (
        <div style={{ marginTop: 12, marginLeft: 52 }}>
          {loadingUsers ? (
            <div style={{ fontSize: 12, color: '#8A8D94', padding: '8px 0' }}>Loading accounts…</div>
          ) : users.length === 0 && !showCreate ? (
            <div style={{ fontSize: 12, color: '#8A8D94', padding: '8px 0' }}>No staff accounts yet.</div>
          ) : (
            users.map((u) => (
              <StaffRow
                key={u.id} user={u} bizId={biz.id}
                onUpdated={(updated) => setUsers((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
                onDeleted={(id) => setUsers((prev) => prev.filter((x) => x.id !== id))}
              />
            ))
          )}

          {showCreate ? (
            <CreateStaffForm
              bizId={biz.id}
              onCreated={(u) => { setUsers((prev) => [...prev, u]); setShowCreate(false); }}
              onCancel={() => setShowCreate(false)}
            />
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 10px', background: 'transparent', border: '1px dashed #C7E5D7', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', color: '#1D9E75' }}
            >
              <Plus size={13} /> Add account
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Settings card wrapper ─────────────────────────────────────
function SCard({ title, desc, right, children, danger }: {
  title: string; desc?: string; right?: React.ReactNode; children?: React.ReactNode; danger?: boolean;
}) {
  return (
    <div style={{ background: 'white', borderRadius: 16, boxShadow: danger ? '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(220,60,80,0.15)' : '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)', padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: desc ? 4 : 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: danger ? '#9C2848' : '#1A1A1F' }}>{title}</div>
        {right}
      </div>
      {desc && <div style={{ fontSize: 12, color: '#5C5F66', marginBottom: 14 }}>{desc}</div>}
      {children}
    </div>
  );
}

function FieldRow({ label, value, apiKey, readOnly }: {
  label: string; value: string; apiKey?: string; readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(value); }, [value]);

  async function handleSave() {
    if (apiKey) {
      setSaving(true);
      try {
        await api.updateProfile({ [apiKey]: draft });
        if (apiKey === 'name') localStorage.setItem('nook_biz', draft);
        toast(`${label} updated`, 'success');
        setEditing(false);
      } catch { toast(`Failed to update ${label}`, 'error'); }
      finally { setSaving(false); }
    } else { setEditing(false); toast(`${label} updated`, 'success'); }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #F0F0F2' }}>
      <div style={{ fontSize: 12, color: '#8A8D94' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        {editing ? (
          <>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }} autoFocus style={{ height: 26, padding: '0 8px', border: '1px solid #1D9E75', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', minWidth: 160 }} />
            <button onClick={handleSave} disabled={saving} style={{ height: 26, padding: '0 8px', border: 0, background: saving ? '#8A8D94' : '#1D9E75', color: 'white', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 12, fontFamily: 'inherit' }}>{saving ? '…' : 'Save'}</button>
            <button onClick={() => setEditing(false)} style={{ height: 26, padding: '0 8px', border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#8A8D94', fontFamily: 'inherit' }}>Cancel</button>
          </>
        ) : (
          <>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{draft}</span>
            {!readOnly && <button onClick={() => setEditing(true)} style={{ height: 26, padding: '0 8px', border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#8A8D94', fontFamily: 'inherit' }}>Edit</button>}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────


// ─── Tap-screen promo (Tap Moment marketing) ─────────────────
function TapPromoCard() {
  const [promo, setPromo] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getLocation()
      .then((l) => { setPromo(l.tap_promo ?? ''); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await api.saveLocation({ tap_promo: promo.trim() });
      toast(promo.trim() ? '저장! 지금부터 적립 화면에 표시돼요.' : '프로모 메시지를 껐어요.', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save', 'error');
    }
    setSaving(false);
  }

  return (
    <SCard
      title="적립 화면 프로모 (Tap Moment)"
      desc="손님이 적립 직후 3초간 반드시 보는 화면에 띄울 한 줄. 오늘의 메뉴, 신메뉴, 이벤트 홍보에 쓰세요."
      right={
        <span style={{
          fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
          background: promo.trim() ? '#FFF9E8' : '#F3F4F6', color: promo.trim() ? '#8C5A11' : '#8A8D94',
        }}>
          {promo.trim() ? '📣 표시 중' : '꺼짐'}
        </span>
      }
    >
      <textarea
        value={promo}
        onChange={(e) => setPromo(e.target.value.slice(0, 120))}
        placeholder="예: 이번 주 신메뉴 흑임자 라떼 출시! / 금요일은 베이글 1+1"
        rows={2}
        disabled={!loaded}
        style={{
          width: '100%', padding: '11px 13px', border: '1px solid #EBEBEB', borderRadius: 9,
          fontSize: 13.5, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span style={{ fontSize: 11.5, color: '#8A8D94' }}>{promo.length}/120 · 비우고 저장하면 배너가 사라져요</span>
        <button onClick={save} disabled={saving || !loaded} style={{
          height: 34, padding: '0 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
          background: saving ? '#9CA3AF' : '#1D9E75', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
        }}>
          {saving ? '저장 중…' : '저장'}
        </button>
      </div>
      {promo.trim() && (
        <div style={{ marginTop: 12, padding: '11px 14px', borderRadius: 11, background: '#FFF9E8', border: '1.5px solid #F0D48A' }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#8C5A11', letterSpacing: 1 }}>📣 오늘의 소식 — 미리보기</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#5A4A1A', marginTop: 3 }}>{promo}</div>
        </div>
      )}
    </SCard>
  );
}

// ─── Store location (for wallet proximity features) ──────────
function StoreLocationCard() {
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [results, setResults] = useState<Array<{ lat: number; lng: number; display_name: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getLocation()
      .then((l) => { setAddress(l.address ?? ''); setLat(l.lat); setLng(l.lng); })
      .catch(() => { /* not critical */ });
  }, []);

  async function save(la: number, ln: number, addr?: string) {
    setSaving(true);
    try {
      await api.saveLocation({ lat: la, lng: ln, ...(addr !== undefined ? { address: addr } : {}) });
      setLat(la); setLng(ln); setResults([]);
      toast('매장 위치가 저장되었습니다. 고객 월렛에서 거리/근처 표시가 활성화돼요.', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save location', 'error');
    }
    setSaving(false);
  }

  async function findByAddress() {
    if (address.trim().length < 3) { toast('주소를 입력해주세요', 'error'); return; }
    setBusy(true); setResults([]);
    try {
      const r = await api.geocodeAddress(address.trim());
      if (r.length === 1) { await save(r[0].lat, r[0].lng, address.trim()); }
      else setResults(r);
    } catch (e) {
      toast(e instanceof Error ? e.message : '주소를 찾지 못했어요. "현재 위치로 설정"을 사용해보세요.', 'error');
    }
    setBusy(false);
  }

  function useCurrent() {
    if (!('geolocation' in navigator)) { toast('이 기기에서 위치를 사용할 수 없어요', 'error'); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => { await save(pos.coords.latitude, pos.coords.longitude, address.trim() || undefined); setBusy(false); },
      () => { toast('위치 권한이 거부되었어요. 매장에서 이 버튼을 눌러주세요.', 'error'); setBusy(false); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  const hasCoords = lat != null && lng != null;

  return (
    <SCard
      title="매장 위치 (Store location)"
      desc="위치를 설정하면 고객 월렛에서 거리 표시 · 근처 매장 카드 자동 열림이 작동합니다."
      right={
        <span style={{
          fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
          background: hasCoords ? '#E8F7F2' : '#FEF3E2', color: hasCoords ? '#085041' : '#B45309',
        }}>
          {hasCoords ? '✓ 설정됨' : '미설정'}
        </span>
      }
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && findByAddress()}
          placeholder="예: 200 Main St, Fort Lee, NJ 07024"
          style={{
            flex: '1 1 240px', padding: '11px 13px', border: '1px solid #EBEBEB', borderRadius: 9,
            fontSize: 13.5, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
          }}
        />
        <button onClick={findByAddress} disabled={busy || saving} style={{
          height: 40, padding: '0 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
          background: busy ? '#9CA3AF' : '#1D9E75', color: 'white', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
        }}>
          <MapPin size={14} /> {busy ? '검색 중…' : '주소로 좌표 찾기'}
        </button>
        <button onClick={useCurrent} disabled={busy || saving} style={{
          height: 40, padding: '0 14px', borderRadius: 9, cursor: 'pointer',
          border: '1.5px solid #1D9E75', background: 'white', color: '#085041', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
        }}>
          <LocateFixed size={14} /> 현재 위치로 설정
        </button>
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: '#5C5F66', marginBottom: 6 }}>주소 후보를 선택하세요:</div>
          {results.map((r, i) => (
            <button key={i} onClick={() => save(r.lat, r.lng, address.trim())} disabled={saving} style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '10px 13px', marginBottom: 6,
              border: '1px solid #D4E6DB', borderRadius: 9, background: '#F8FBFA', cursor: 'pointer',
              fontSize: 12.5, color: '#1A1A1F', fontFamily: 'inherit',
            }}>
              📍 {r.display_name}
            </button>
          ))}
        </div>
      )}

      {hasCoords && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#5C5F66', fontFamily: 'var(--font-mono)' }}>
          현재 좌표: {lat!.toFixed(6)}, {lng!.toFixed(6)}
        </div>
      )}
      <div style={{ marginTop: 10, fontSize: 11.5, color: '#8A8D94' }}>
        팁: 매장 안에서 &quot;현재 위치로 설정&quot;을 누르는 게 가장 정확해요.
      </div>
    </SCard>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { isMobile } = useBreakpoint();
  const [tab, setTab] = useState('workspace');
  const [bizName, setBizName] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [businesses, setBusinesses] = useState<ApiBusiness[]>([]);
  const [loadingBiz, setLoadingBiz] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  useEffect(() => {
    const decoded = decodeToken();
    if (!decoded || (!decoded.is_superadmin && decoded.is_staff)) {
      router.replace('/dashboard');
      return;
    }
    setIsSuperadmin(decoded.is_superadmin ?? false);
    const stored = localStorage.getItem('nook_biz') ?? '';
    setBizName(stored);
    try {
      const token = localStorage.getItem('nook_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email) setBizEmail(payload.email);
      }
    } catch { /* ignore */ }
  }, [router]);

  const loadBusinesses = useCallback(async () => {
    setLoadingBiz(true);
    try {
      const data = await api.listBusinesses();
      setBusinesses(data);
    } catch { /* ignore */ }
    setLoadingBiz(false);
  }, []);

  useEffect(() => {
    if (tab === 'businesses' && isSuperadmin) loadBusinesses();
  }, [tab, isSuperadmin, loadBusinesses]);

  // Export alert count for topbar badge — write to localStorage
  useEffect(() => {
    localStorage.setItem('nook_alert_count', String(ALERT_COUNT));
    window.dispatchEvent(new CustomEvent('nook:alerts', { detail: { count: ALERT_COUNT } }));
  }, []);

  const TABS: { key: string; label: string; icon: React.ElementType; alert?: boolean }[] = [
    { key: 'workspace',    label: 'Workspace',    icon: Briefcase },
    ...(isSuperadmin ? [{ key: 'businesses', label: 'Businesses', icon: Users }] : []),
    { key: 'billing',      label: 'Billing',      icon: CreditCard },
    { key: 'integrations', label: 'Integrations', icon: Zap, alert: ALERT_COUNT > 0 },
  ];

  return (
    <div style={{ padding: isMobile ? '16px' : '24px 28px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr', gap: isMobile ? 16 : 24 }}>
      {/* Tab nav */}
      <nav style={isMobile ? {
        display: 'flex', gap: 2, overflowX: 'auto', padding: 3,
        background: '#F0F1F4', borderRadius: 9, scrollbarWidth: 'none',
      } : { display: 'grid', gap: 2, alignContent: 'start' }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: isMobile ? '6px 10px' : '8px 12px', border: 0, borderRadius: 8,
              background: tab === t.key ? (isMobile ? 'white' : '#E8F7F2') : 'transparent',
              color: tab === t.key ? (isMobile ? '#1A1A1F' : '#085041') : '#5C5F66',
              fontWeight: tab === t.key ? 500 : 400,
              textAlign: 'left', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap', flexShrink: 0,
              boxShadow: (isMobile && tab === t.key) ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex', alignItems: 'center', gap: 7, position: 'relative',
            }}>
              {!isMobile && <Icon size={14} />}
              {t.label}
              {t.alert && (
                <span style={{ width: 7, height: 7, borderRadius: 999, background: '#E05050', display: 'inline-block', marginLeft: 2 }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <div style={{ display: 'grid', gap: 16 }}>

        {/* WORKSPACE */}
        {tab === 'workspace' && <>
          <SCard title="Workspace" desc="Your business profile on Nook.">
            <FieldRow label="Business name" value={bizName} apiKey="name" />
            <FieldRow label="Owner email" value={bizEmail} apiKey="owner_email" />
            <FieldRow label="Region" value="us-east-1" readOnly />
            <FieldRow label="Timezone" value="America/New_York" readOnly />
          </SCard>
          <StoreLocationCard />
          <TapPromoCard />
          <SCard title="Danger zone" danger>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Delete workspace</div>
                <div style={{ fontSize: 12, color: '#5C5F66' }}>Permanently deletes all businesses, cards, and customers.</div>
              </div>
              <button style={{ height: 32, padding: '0 12px', border: '1px solid #E5BCC9', borderRadius: 8, background: 'white', color: '#9C2848', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Delete</button>
            </div>
          </SCard>
        </>}

        {/* BUSINESSES (superadmin only) */}
        {tab === 'businesses' && isSuperadmin && (
          <SCard
            title="Businesses"
            desc="All businesses registered on Nook. Expand each to manage staff accounts."
          >
            {loadingBiz ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#8A8D94', fontSize: 13 }}>Loading businesses…</div>
            ) : businesses.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#8A8D94', fontSize: 13 }}>No businesses found.</div>
            ) : (
              businesses.map((b) => <BizCard key={b.id} biz={b} />)
            )}
          </SCard>
        )}

        {/* BILLING */}
        {tab === 'billing' && <>
          <SCard title="Current plan"
            right={<button style={{ height: 32, padding: '0 12px', background: '#1D9E75', color: 'white', border: 0, borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Upgrade to Pro</button>}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: '#E8F7F2', borderRadius: 10, marginTop: 8 }}>
              <div style={{ flex: 1, lineHeight: 1.4 }}>
                <div style={{ fontWeight: 500, color: '#085041' }}>Trial {String.fromCharCode(183)} 14 days left</div>
                <div style={{ fontSize: 12, color: '#085041', opacity: 0.8 }}>Pro is $79/mo per business {String.fromCharCode(183)} unlimited cards, Apple Wallet, coupon system.</div>
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { plan: 'Basic', price: '$59/mo', features: 'Up to 100 customers, 1 card, stamps + Google Wallet' },
                { plan: 'Pro', price: '$79/mo', features: 'Up to 500 customers, 3 cards, coupons, Apple Wallet' },
                { plan: 'Premium', price: '$119/mo', features: 'Unlimited everything, analytics, priority support' },
              ].map((p) => (
                <div key={p.plan} style={{ padding: 12, borderRadius: 10, border: '1px solid #EBEBEB', lineHeight: 1.4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.plan}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1D9E75', margin: '4px 0' }}>{p.price}</div>
                  <div style={{ fontSize: 11, color: '#8A8D94' }}>{p.features}</div>
                </div>
              ))}
            </div>
          </SCard>
          <SCard title="Usage this month">
            {[
              { label: 'Active customers', used: 284, cap: 500 },
              { label: 'Push notifications', used: 612, cap: 2000 },
              { label: 'Wallet passes', used: 284, cap: 'Unlimited' },
            ].map(({ label, used, cap }) => {
              const pct = typeof cap === 'number' ? Math.min(100, (used / cap) * 100) : 30;
              return (
                <div key={label} style={{ padding: '10px 0', borderTop: '1px solid #F0F0F2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span>{label}</span>
                    <span style={{ color: '#8A8D94', fontFamily: 'var(--font-mono)' }}>{used} / {cap}</span>
                  </div>
                  <div style={{ height: 6, background: '#F0F0F2', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#1D9E75', transition: 'width 400ms' }} />
                  </div>
                </div>
              );
            })}
          </SCard>
        </>}

        {/* INTEGRATIONS */}
        {tab === 'integrations' && (
          <>
            {ALERT_COUNT > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#FBF0E2', border: '1px solid #EDD9AC', borderRadius: 10 }}>
                <AlertTriangle size={16} color="#8C5A11" />
                <div style={{ fontSize: 13, color: '#8C5A11' }}>
                  <strong>{ALERT_COUNT} integration{ALERT_COUNT !== 1 ? 's' : ''}</strong> need attention. See details below.
                </div>
              </div>
            )}
            <SCard title="Integrations" desc="Status of all connected systems and APIs.">
              {INTEGRATIONS.map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0', borderTop: i ? '1px solid #F0F0F2' : 'none' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
                    background: it.ok ? '#E8F7F2' : '#FBF0E2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {it.ok
                      ? <Check size={14} color="#085041" />
                      : <AlertTriangle size={14} color="#8C5A11" />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{it.n}</span>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 999,
                        background: it.ok ? '#E8F7F2' : '#F0F1F4',
                        color: it.ok ? '#085041' : '#5C5F66', fontWeight: 500,
                      }}>
                        {it.ok ? '● Connected' : '○ Not connected'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#8A8D94', marginTop: 2 }}>{it.d}</div>
                    {!it.ok && it.note && (
                      <div style={{ fontSize: 12, color: '#8C5A11', marginTop: 3 }}>⚠ {it.note}</div>
                    )}
                  </div>
                  {!it.ok && (
                    <button style={{ height: 30, padding: '0 10px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </SCard>
          </>
        )}
      </div>
    </div>
  );
}
