'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ApiBusiness, ApiStaffUser } from '@/lib/api';
import {
  ALL_PAGES, LEVEL_ORDER, LEVEL_LABELS, LEVEL_COLORS, ROLE_PRESETS,
  PermLevel, PageKey, decodeToken,
} from '@/lib/permissions';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Shield, Users, Plus, Trash2, Eye, Edit3, ChevronDown, X, Check, RefreshCw } from 'lucide-react';

// ─── Segment control ─────────────────────────────────────────
function Seg({ tabs, active, setActive }: { tabs: string[]; active: string; setActive: (t: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: '#F0F1F4', borderRadius: 9, padding: 3 }}>
      {tabs.map((t) => (
        <button key={t} onClick={() => setActive(t)} style={{
          height: 28, padding: '0 14px', border: 0, borderRadius: 7,
          background: active === t ? 'white' : 'transparent',
          color: active === t ? '#1A1A1F' : '#5C5F66',
          fontSize: 12, fontWeight: active === t ? 500 : 400,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: active === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
        }}>{t}</button>
      ))}
    </div>
  );
}

// ─── Permission pill dropdown ─────────────────────────────────
function PermDropdown({
  value, onChange, disabled,
}: { value: PermLevel; onChange: (v: PermLevel) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const { bg, color } = LEVEL_COLORS[value];
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          height: 26, padding: '0 8px',
          background: bg, color, border: 'none',
          borderRadius: 6, cursor: disabled ? 'default' : 'pointer',
          fontSize: 11, fontWeight: 500, fontFamily: 'inherit',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {LEVEL_LABELS[value]}
        {!disabled && <ChevronDown size={10} />}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 20, marginTop: 4,
            background: 'white', border: '1px solid #EBEBEB', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: 4, minWidth: 90,
          }}>
            {LEVEL_ORDER.map((lvl) => (
              <button key={lvl} onClick={() => { onChange(lvl); setOpen(false); }} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '7px 10px', border: 0, borderRadius: 6,
                background: value === lvl ? '#F5F6FA' : 'transparent',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, textAlign: 'left',
                color: LEVEL_COLORS[lvl].color,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: 999, flexShrink: 0,
                  background: LEVEL_COLORS[lvl].bg, border: `1.5px solid ${LEVEL_COLORS[lvl].color}`,
                }} />
                {LEVEL_LABELS[lvl]}
                {value === lvl && <Check size={10} style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Permission matrix row ────────────────────────────────────
function PermRow({
  page, label, value, onChange, disabled,
}: { page: PageKey; label: string; value: PermLevel; onChange: (v: PermLevel) => void; disabled?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 0', borderBottom: '1px solid #F5F5F7',
    }}>
      <span style={{ fontSize: 13, color: '#1A1A1F' }}>{label}</span>
      <PermDropdown value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// ─── Business permission panel ────────────────────────────────
function BizPermPanel({ biz, onUpdate }: { biz: ApiBusiness; onUpdate: (b: ApiBusiness) => void }) {
  const [perms, setPerms] = useState<Record<string, PermLevel>>(
    (biz.page_permissions as Record<string, PermLevel>) ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const isSuper = biz.is_superadmin;

  const getLevel = (key: PageKey): PermLevel =>
    isSuper ? 'admin' : (perms[key] as PermLevel) ?? 'admin';

  async function save() {
    setSaving(true);
    try {
      const updated = await api.updateBusinessPermissions(biz.id, perms);
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #EBEBEB', padding: 18, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: isSuper ? '#1D9E75' : '#1A1A1F',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700,
            }}>
              {biz.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{biz.name}</div>
              <div style={{ fontSize: 11, color: '#8A8D94' }}>{biz.owner_email}</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isSuper && (
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#E8F7F2', color: '#085041', fontWeight: 500 }}>
              ★ Superadmin
            </span>
          )}
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#F0F1F4', color: '#5C5F66' }}>
            {biz.plan}
          </span>
          {!isSuper && (
            <button
              onClick={save}
              disabled={saving}
              style={{
                height: 28, padding: '0 12px', border: 0, borderRadius: 7,
                background: saved ? '#E8F7F2' : '#1D9E75', color: saved ? '#085041' : 'white',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0 24px' }}>
        {ALL_PAGES.map(({ key, label }) => (
          <PermRow
            key={key} page={key} label={label}
            value={getLevel(key)}
            disabled={isSuper}
            onChange={(v) => setPerms((prev) => ({ ...prev, [key]: v }))}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Staff user modal ─────────────────────────────────────────
function StaffModal({
  user, onClose, onSave,
}: {
  user: ApiStaffUser | null;
  onClose: () => void;
  onSave: (data: ApiStaffUser) => void;
}) {
  const isEdit = !!user;
  const [email, setEmail] = useState(user?.email ?? '');
  const [name, setName] = useState(user?.name ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role ?? 'viewer');
  const [perms, setPerms] = useState<Record<string, PermLevel>>(
    (user?.page_permissions as Record<string, PermLevel>) ?? ROLE_PRESETS.viewer
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  function applyPreset(r: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRole(r as any);
    if (ROLE_PRESETS[r]) setPerms(ROLE_PRESETS[r] as Record<string, PermLevel>);
  }

  async function handleSave() {
    if (!email || !name) { setErr('Email and name are required.'); return; }
    if (!isEdit && !password) { setErr('Password is required for new users.'); return; }
    setSaving(true);
    setErr('');
    try {
      let result: ApiStaffUser;
      if (isEdit && user) {
        result = await api.updateStaff(user.id, { name, role, page_permissions: perms, ...(password ? { password } : {}) });
      } else {
        result = await api.createStaff({ email, name, role, password, page_permissions: perms });
      }
      onSave(result);
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Failed';
      try { setErr(JSON.parse(raw).error ?? raw); } catch { setErr(raw); }
    } finally {
      setSaving(false);
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 11px', border: '1px solid #EBEBEB',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none',
    background: 'white', color: '#1A1A1F', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{isEdit ? 'Edit staff user' : 'Invite staff'}</div>
          <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="#5C5F66" />
          </button>
        </div>

        {/* Basic info */}
        <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>NAME</div>
            <input value={name} onChange={(e) => setName(e.target.value)} style={inp} placeholder="Full name" />
          </div>
          {!isEdit && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>EMAIL</div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} style={inp} placeholder="staff@example.com" type="email" />
            </div>
          )}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{isEdit ? 'NEW PASSWORD (leave blank to keep)' : 'PASSWORD'}</div>
            <input value={password} onChange={(e) => setPassword(e.target.value)} style={inp} placeholder={isEdit ? 'Leave blank to keep current' : 'Set login password'} type="password" />
          </div>
        </div>

        {/* Role presets */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>ROLE PRESET</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['viewer', 'editor', 'admin'].map((r) => (
              <button key={r} onClick={() => applyPreset(r)} style={{
                flex: 1, height: 34, border: `1px solid ${role === r ? '#1D9E75' : '#EBEBEB'}`,
                background: role === r ? '#E8F7F2' : 'white',
                color: role === r ? '#085041' : '#5C5F66',
                borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                fontFamily: 'inherit', textTransform: 'capitalize',
              }}>{r}</button>
            ))}
          </div>
        </div>

        {/* Per-page permissions */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>PAGE PERMISSIONS</div>
          <div style={{ border: '1px solid #EBEBEB', borderRadius: 10, padding: '0 12px' }}>
            {ALL_PAGES.map(({ key, label }) => (
              <PermRow
                key={key} page={key} label={label}
                value={(perms[key] as PermLevel) ?? 'none'}
                onChange={(v) => setPerms((prev) => ({ ...prev, [key]: v }))}
              />
            ))}
          </div>
        </div>

        {err && (
          <div style={{ padding: '8px 12px', background: '#FBE2EC', borderRadius: 8, fontSize: 12, color: '#9C2848', marginBottom: 12 }}>
            {err}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', height: 38, background: saving ? '#8A8D94' : '#1D9E75',
            color: 'white', border: 0, borderRadius: 9, fontSize: 13, fontWeight: 500,
            cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
          }}
        >
          {saving ? 'Saving…' : isEdit ? 'Update user' : 'Create user'}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function PermissionsPage() {
  const { isMobile } = useBreakpoint();
  const [tab, setTab] = useState('staff');
  const [token] = useState(() => decodeToken());
  const isSuperadmin = token?.is_superadmin ?? false;

  // Businesses tab (superadmin)
  const [businesses, setBusinesses] = useState<ApiBusiness[]>([]);
  const [bizLoading, setBizLoading] = useState(false);

  // Staff tab
  const [staff, setStaff] = useState<ApiStaffUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [modalUser, setModalUser] = useState<ApiStaffUser | 'new' | null>(null);

  const loadBusinesses = useCallback(async () => {
    if (!isSuperadmin) return;
    setBizLoading(true);
    try {
      const data = await api.listBusinesses();
      setBusinesses(data);
    } catch { /* ignore */ }
    finally { setBizLoading(false); }
  }, [isSuperadmin]);

  const loadStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      const data = await api.listStaff();
      setStaff(data);
    } catch { /* ignore */ }
    finally { setStaffLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'businesses' && isSuperadmin) loadBusinesses();
    if (tab === 'staff') loadStaff();
  }, [tab, loadBusinesses, loadStaff, isSuperadmin]);

  async function handleDeleteStaff(id: string) {
    if (!confirm('Remove this staff member?')) return;
    try {
      await api.deleteStaff(id);
      setStaff((prev) => prev.filter((u) => u.id !== id));
    } catch { /* ignore */ }
  }

  async function handleToggleActive(user: ApiStaffUser) {
    try {
      const updated = await api.updateStaff(user.id, { is_active: !user.is_active });
      setStaff((prev) => prev.map((u) => u.id === user.id ? updated : u));
    } catch { /* ignore */ }
  }

  const tabs = isSuperadmin ? ['staff', 'businesses'] : ['staff'];

  return (
    <div style={{ padding: isMobile ? '16px' : '24px 28px', display: 'grid', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={20} color="#1D9E75" />
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em' }}>Permissions</div>
          </div>
          <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 2 }}>
            {isSuperadmin ? 'Manage access for all businesses and their staff' : 'Manage staff access for your business'}
          </div>
        </div>
        {tab === 'staff' && (
          <button
            onClick={() => setModalUser('new')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              height: 32, padding: '0 14px',
              background: '#1D9E75', color: 'white', border: 0,
              borderRadius: 8, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Plus size={14} /> Invite staff
          </button>
        )}
      </div>

      <Seg tabs={tabs} active={tab} setActive={setTab} />

      {/* ─── Staff tab ─────────────────────────────────────── */}
      {tab === 'staff' && (
        <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', overflow: 'hidden' }}>
          {staffLoading ? (
            <div style={{ padding: 48, textAlign: 'center', fontSize: 13, color: '#8A8D94' }}>Loading staff…</div>
          ) : staff.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Users size={28} color="#EBEBEB" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No staff yet</div>
              <div style={{ fontSize: 13, color: '#8A8D94' }}>Invite a team member to get started.</div>
              <button
                onClick={() => setModalUser('new')}
                style={{
                  marginTop: 16, height: 34, padding: '0 16px',
                  background: '#1D9E75', color: 'white', border: 0,
                  borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                + Invite first staff
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#FAFAFB' }}>
                  {['Name', 'Email', 'Role', 'Status', 'Key permissions', ''].map((h, i) => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 500, color: '#8A8D94',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      display: (i >= 3 && isMobile) ? 'none' : undefined,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((u) => (
                  <tr key={u.id} style={{ borderTop: '1px solid #F0F0F2' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 999,
                          background: '#F0F1F4', color: '#5C5F66',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 600,
                        }}>
                          {u.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#5C5F66' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 999,
                        background: u.role === 'admin' ? '#E8F7F2' : u.role === 'editor' ? '#FBF0E2' : '#F0F1F4',
                        color: u.role === 'admin' ? '#085041' : u.role === 'editor' ? '#8C5A11' : '#5C5F66',
                        fontWeight: 500, textTransform: 'capitalize',
                      }}>{u.role}</span>
                    </td>
                    {!isMobile && (
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => handleToggleActive(u)}
                          style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 999,
                            background: u.is_active ? '#E8F7F2' : '#F0F1F4',
                            color: u.is_active ? '#085041' : '#5C5F66',
                            border: 0, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                          }}
                        >
                          {u.is_active ? '● Active' : '○ Inactive'}
                        </button>
                      </td>
                    )}
                    {!isMobile && (
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {ALL_PAGES.filter((p) => {
                            const lvl = (u.page_permissions[p.key] as PermLevel) ?? 'none';
                            return lvl !== 'none';
                          }).slice(0, 4).map(({ key, label }) => {
                            const lvl = (u.page_permissions[key] as PermLevel) ?? 'none';
                            return (
                              <span key={key} style={{
                                fontSize: 10, padding: '1px 6px', borderRadius: 4,
                                background: LEVEL_COLORS[lvl].bg,
                                color: LEVEL_COLORS[lvl].color,
                              }}>
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    )}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setModalUser(u)}
                          style={{ height: 28, padding: '0 10px', border: '1px solid #EBEBEB', borderRadius: 7, background: 'white', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Edit3 size={12} color="#5C5F66" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(u.id)}
                          style={{ height: 28, width: 28, border: '1px solid #EBEBEB', borderRadius: 7, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={13} color="#C53A6B" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ─── Businesses tab (superadmin only) ────────────── */}
      {tab === 'businesses' && isSuperadmin && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: '#5C5F66' }}>
              Set which pages each business owner can access. Superadmin always has full access.
            </div>
            <button
              onClick={loadBusinesses}
              style={{ height: 28, padding: '0 10px', border: '1px solid #EBEBEB', borderRadius: 7, background: 'white', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          {bizLoading ? (
            <div style={{ padding: 48, textAlign: 'center', fontSize: 13, color: '#8A8D94', background: 'white', borderRadius: 13, border: '1px solid #EBEBEB' }}>
              Loading businesses…
            </div>
          ) : (
            businesses.map((biz) => (
              <BizPermPanel
                key={biz.id}
                biz={biz}
                onUpdate={(updated) => setBusinesses((prev) => prev.map((b) => b.id === updated.id ? updated : b))}
              />
            ))
          )}
        </div>
      )}

      {/* ─── Staff modal ─────────────────────────────────── */}
      {modalUser !== null && (
        <StaffModal
          user={modalUser === 'new' ? null : modalUser}
          onClose={() => setModalUser(null)}
          onSave={(saved) => {
            setStaff((prev) => {
              const idx = prev.findIndex((u) => u.id === saved.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
              }
              return [saved, ...prev];
            });
            setModalUser(null);
          }}
        />
      )}
    </div>
  );
}
