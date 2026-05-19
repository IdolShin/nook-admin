'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, ChevronDown, ChevronRight, AlertTriangle, Check, Eye, EyeOff, Shield, Users, Briefcase, CreditCard, Zap, Star, ExternalLink, Link } from 'lucide-react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { api, type ApiBusiness, type ApiStaffUser, type ApiCoupon, type ApiReviewConfig } from '@/lib/api';
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

// ─── Google Review Settings panel ─────────────────────────────
function GoogleReviewPanel() {
  const [reviewUrl, setReviewUrl]       = useState('');
  const [draftUrl, setDraftUrl]         = useState('');
  const [editingUrl, setEditingUrl]     = useState(false);
  const [savingUrl, setSavingUrl]       = useState(false);

  const [config, setConfig]             = useState<ApiReviewConfig>({
    enabled: false, reward_type: 'stamp', stamp_count: 1, coupon_id: null, days_to_wait: 3,
  });
  const [coupons, setCoupons]           = useState<ApiCoupon[]>([]);
  const [loading, setLoading]           = useState(true);
  const [savingCfg, setSavingCfg]       = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [cfgData, couponData] = await Promise.all([
          api.getReviewConfig(),
          api.coupons(),
        ]);
        setReviewUrl(cfgData.google_review_url || '');
        setDraftUrl(cfgData.google_review_url || '');
        setConfig(cfgData.review_reward_config);
        setCoupons(couponData.filter((c) => c.is_active));
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  async function saveUrl() {
    setSavingUrl(true);
    try {
      const res = await api.updateReviewConfig({ google_review_url: draftUrl.trim() });
      setReviewUrl(res.google_review_url || '');
      setDraftUrl(res.google_review_url || '');
      setEditingUrl(false);
      toast('Review link saved', 'success');
    } catch { toast('Failed to save link', 'error'); }
    setSavingUrl(false);
  }

  async function saveConfig(patch: Partial<ApiReviewConfig>) {
    const next = { ...config, ...patch };
    setConfig(next);
    setSavingCfg(true);
    try {
      const res = await api.updateReviewConfig({ review_reward_config: next });
      setConfig(res.review_reward_config);
      toast('Reward settings saved', 'success');
    } catch { toast('Failed to save settings', 'error'); }
    setSavingCfg(false);
  }

  const urlOk   = reviewUrl.trim().length > 0;
  const inputSt: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit',
    border: '1px solid #EBEBEB', borderRadius: 8, outline: 'none', background: 'white',
    color: '#1A1A1F', boxSizing: 'border-box',
  };

  if (loading) return <div style={{ padding: '24px 0', textAlign: 'center', color: '#8A8D94', fontSize: 13 }}>Loading...</div>;

  return (
    <div style={{ display: 'grid', gap: 16 }}>

      {/* ── Google Review URL card ── */}
      <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Google Review Link</div>
          {/* Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: urlOk ? '#E8F7F2' : '#FBF0E2', border: `1px solid ${urlOk ? '#C7E5D7' : '#EDD9AC'}` }}>
            {urlOk
              ? <><Check size={12} color="#085041" /><span style={{ fontSize: 11, color: '#085041', fontWeight: 600 }}>Link set</span></>
              : <><AlertTriangle size={12} color="#8C5A11" /><span style={{ fontSize: 11, color: '#8C5A11', fontWeight: 600 }}>Link needed</span></>
            }
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#5C5F66', marginBottom: 16 }}>
          Google Maps {String.fromCharCode(8594)} Your business {String.fromCharCode(8594)} Reviews {String.fromCharCode(8594)} &ldquo;Get more reviews&rdquo; {String.fromCharCode(8594)} copy the short URL.
        </div>

        {!editingUrl ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #EBEBEB', background: urlOk ? '#F5FDFB' : '#F9FAFB', fontSize: 13, color: urlOk ? '#1D9E75' : '#8A8D94', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {urlOk ? reviewUrl : 'No link entered yet'}
            </div>
            {urlOk && (
              <a href={reviewUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, height: 34, padding: '0 10px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', color: '#5C5F66', fontSize: 12, textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <ExternalLink size={12} /> Test
              </a>
            )}
            <button onClick={() => { setDraftUrl(reviewUrl); setEditingUrl(true); }} style={{ height: 34, padding: '0 12px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', color: '#5C5F66' }}>
              {urlOk ? 'Edit' : 'Add link'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Link size={14} color="#8A8D94" style={{ position: 'absolute', left: 10, pointerEvents: 'none' }} />
              <input
                value={draftUrl}
                onChange={(e) => setDraftUrl(e.target.value)}
                placeholder="https://g.page/r/..."
                style={{ ...inputSt, paddingLeft: 32 }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={saveUrl} disabled={savingUrl} style={{ height: 34, padding: '0 14px', background: '#1D9E75', color: 'white', border: 0, borderRadius: 8, fontSize: 13, cursor: savingUrl ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {savingUrl ? 'Saving...' : 'Save link'}
              </button>
              <button onClick={() => { setEditingUrl(false); setDraftUrl(reviewUrl); }} style={{ height: 34, padding: '0 12px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', color: '#5C5F66' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Reward config card ── */}
      <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Review Reward Settings</div>
          {/* Toggle */}
          <button
            onClick={() => saveConfig({ enabled: !config.enabled })}
            disabled={savingCfg}
            style={{
              width: 44, height: 24, borderRadius: 999, border: 0, cursor: 'pointer', padding: 0,
              background: config.enabled ? '#1D9E75' : '#D4D6DC', position: 'relative', transition: 'background 200ms',
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 999, background: 'white',
              position: 'absolute', top: 3,
              left: config.enabled ? 23 : 3,
              transition: 'left 200ms',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#5C5F66', marginBottom: 16 }}>
          When enabled, customers are invited to leave a Google review after joining. After {config.days_to_wait} days, they automatically receive the reward with a push notification.
        </div>

        {!config.enabled && (
          <div style={{ padding: '12px 14px', background: '#F5F6FA', borderRadius: 10, fontSize: 12, color: '#8A8D94', textAlign: 'center' }}>
            Toggle on to configure the reward
          </div>
        )}

        {config.enabled && (
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Days to wait */}
            <div>
              <div style={{ fontSize: 12, color: '#5C5F66', marginBottom: 6 }}>Days to wait before issuing reward</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 5, 7].map((d) => (
                  <button key={d} onClick={() => saveConfig({ days_to_wait: d })} style={{
                    height: 34, width: 46, border: `1px solid ${config.days_to_wait === d ? '#1D9E75' : '#EBEBEB'}`,
                    borderRadius: 8, background: config.days_to_wait === d ? '#E8F7F2' : 'white',
                    color: config.days_to_wait === d ? '#085041' : '#5C5F66',
                    fontWeight: config.days_to_wait === d ? 600 : 400,
                    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{d}</button>
                ))}
                <span style={{ fontSize: 12, color: '#8A8D94', alignSelf: 'center', marginLeft: 4 }}>days</span>
              </div>
            </div>

            {/* Reward type */}
            <div>
              <div style={{ fontSize: 12, color: '#5C5F66', marginBottom: 8 }}>Reward type</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { val: 'stamp',          label: 'Stamps',        desc: 'Add stamps to card' },
                  { val: 'coupon_percent', label: 'Discount %',    desc: 'Pick a coupon below' },
                  { val: 'coupon',         label: 'Free item',     desc: 'Pick a coupon below' },
                ].map((opt) => {
                  const isActive = opt.val === 'stamp'
                    ? config.reward_type === 'stamp'
                    : config.reward_type === 'coupon';
                  const handleClick = opt.val === 'stamp'
                    ? () => saveConfig({ reward_type: 'stamp' })
                    : () => saveConfig({ reward_type: 'coupon' });
                  return (
                    <button key={opt.val} onClick={handleClick} style={{
                      padding: '10px 12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                      border: `1px solid ${isActive ? '#1D9E75' : '#EBEBEB'}`,
                      background: isActive ? '#E8F7F2' : 'white',
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#085041' : '#1A1A1F' }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: '#8A8D94', marginTop: 2 }}>{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stamp count */}
            {config.reward_type === 'stamp' && (
              <div>
                <div style={{ fontSize: 12, color: '#5C5F66', marginBottom: 6 }}>Number of stamps to award</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 5].map((n) => (
                    <button key={n} onClick={() => saveConfig({ stamp_count: n })} style={{
                      height: 34, width: 46, border: `1px solid ${config.stamp_count === n ? '#1D9E75' : '#EBEBEB'}`,
                      borderRadius: 8, background: config.stamp_count === n ? '#E8F7F2' : 'white',
                      color: config.stamp_count === n ? '#085041' : '#5C5F66',
                      fontWeight: config.stamp_count === n ? 600 : 400,
                      fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                    }}>{n}</button>
                  ))}
                  <span style={{ fontSize: 12, color: '#8A8D94', alignSelf: 'center', marginLeft: 4 }}>
                    stamp{config.stamp_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Coupon picker */}
            {config.reward_type === 'coupon' && (
              <div>
                <div style={{ fontSize: 12, color: '#5C5F66', marginBottom: 6 }}>Select a coupon to award</div>
                {coupons.length === 0 ? (
                  <div style={{ padding: '12px 14px', background: '#FBF0E2', borderRadius: 10, fontSize: 12, color: '#8C5A11' }}>
                    No active coupons found. Create one in the Coupons page first.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 6 }}>
                    {coupons.map((c) => (
                      <button key={c.id} onClick={() => saveConfig({ coupon_id: c.id })} style={{
                        padding: '10px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                        border: `1px solid ${config.coupon_id === c.id ? '#1D9E75' : '#EBEBEB'}`,
                        background: config.coupon_id === c.id ? '#E8F7F2' : 'white',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <div style={{ width: 10, height: 10, borderRadius: 999, background: c.color || '#1D9E75', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: config.coupon_id === c.id ? '#085041' : '#1A1A1F' }}>{c.title}</div>
                          <div style={{ fontSize: 11, color: '#8A8D94' }}>
                            {c.coupon_type === 'percent' ? `${c.discount_value}% off` : c.coupon_type === 'fixed' ? `$${c.discount_value} off` : c.free_item_name || 'Free item'}
                            {' '}{String.fromCharCode(183)}{' '}valid {c.valid_days} days
                          </div>
                        </div>
                        {config.coupon_id === c.id && <Check size={14} color="#085041" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            {(config.reward_type === 'stamp' || (config.reward_type === 'coupon' && config.coupon_id)) && (
              <div style={{ padding: '12px 14px', background: '#F0FAF6', border: '1px solid #C7E5D7', borderRadius: 10, fontSize: 12, color: '#085041' }}>
                <strong>Active:</strong> Customers who click &ldquo;Leave a Review&rdquo; will receive{' '}
                {config.reward_type === 'stamp'
                  ? <strong>{config.stamp_count} stamp{config.stamp_count !== 1 ? 's' : ''}</strong>
                  : <strong>{coupons.find((c) => c.id === config.coupon_id)?.title || 'the selected coupon'}</strong>
 
