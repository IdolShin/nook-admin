'use client';

import { useState, useMemo, useEffect } from 'react';
import { typeMeta, statusMeta } from '@/lib/utils';
import MiniCardArt from '@/components/cards/MiniCardArt';
import Sparkline from '@/components/charts/Sparkline';
import { api, type ApiCard } from '@/lib/api';
import { Search, Plus, ChevronDown, X, Send, Lock, Pencil, Trash2 } from 'lucide-react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import ResponsiveModal from '@/components/ui/ResponsiveModal';
import { usePlan } from '@/hooks/usePlan';
import { toast } from '@/lib/toast';

/* ─── Types ────────────────────────────────────────────────── */

interface Card {
  id: string;
  name: string;
  biz: string;
  bizColor: string;
  type: string;
  status: string;
  active: number;
  issued: number;
  redemptions: number;
  reward: string;
  updated: string;
  stamps: number | null;
  gradient: string[];
  color: string;
  goal_stamps: number;
  is_active: boolean;
}

const CARD_COLORS: Record<string, string[]> = {
  '#1D9E75': ['#0F4D38', '#1D9E75'],
  '#3B6BCC': ['#0F2A55', '#3B6BCC'],
  '#C26B1F': ['#5C2F0E', '#C26B1F'],
  '#C53A6B': ['#5C1A30', '#C53A6B'],
  '#8B5CF6': ['#3B1A7A', '#8B5CF6'],
  '#1A1A1F': ['#0A0A0E', '#1A1A1F'],
};

function darkenHex(hex: string, amount = 80): string {
  const h = hex.replace('#', '');
  const r = Math.max(0, parseInt(h.slice(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(h.slice(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(h.slice(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function mapApiCard(c: ApiCard): Card {
  const bizName = api.getBusinessName() || 'Nook Café';
  const gradient = CARD_COLORS[c.color] ?? [darkenHex(c.color), c.color];
  const daysSince = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86_400_000);
  const updated = daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince}d ago`;
  return {
    id: c.id,
    name: c.name,
    biz: bizName,
    bizColor: c.color,
    type: c.card_type,
    status: c.is_active ? 'active' : 'paused',
    active: 0,
    issued: 0,
    redemptions: 0,
    reward: c.reward_desc || '',
    updated,
    stamps: c.card_type === 'stamp' ? c.goal_stamps : null,
    gradient,
    color: c.color,
    goal_stamps: c.goal_stamps,
    is_active: c.is_active,
  };
}

/* ─── Shared sub-components ────────────────────────────────── */

function StatusPill({ status }: { status: string }) {
  const s = statusMeta[status] ?? statusMeta.active;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 500,
      padding: '2px 8px', borderRadius: 999,
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />
      {s.label}
    </span>
  );
}

function TypePill({ type }: { type: string }) {
  const t = typeMeta[type] ?? typeMeta.stamp;
  return (
    <span style={{
      fontSize: 11, fontWeight: 500,
      padding: '2px 8px', borderRadius: 999,
      color: t.text, background: t.bg,
    }}>{t.label}</span>
  );
}

function FilterDropdown({ label, value, options, onChange }: {
  label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.value === value);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button onClick={() => setOpen((o) => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between',
        width: '100%', height: 36, padding: '0 12px',
        border: '1px solid #EBEBEB', borderRadius: 9,
        background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
      }}>
        <span style={{ color: '#8A8D94', fontSize: 12 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontWeight: 500 }}>{cur?.label}</span>
          <ChevronDown size={13} color="#8A8D94" />
        </div>
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 38, left: 0, zIndex: 10,
            minWidth: 180, padding: 6,
            background: 'white', borderRadius: 10,
            border: '1px solid #EBEBEB',
            boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
          }}>
            {options.map((o) => (
              <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  display: 'block', width: '100%', padding: '8px 10px',
                  border: 0, background: value === o.value ? '#E8F7F2' : 'transparent',
                  color: value === o.value ? '#085041' : '#1A1A1F',
                  borderRadius: 6, textAlign: 'left', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { if (value !== o.value) (e.currentTarget as HTMLElement).style.background = '#F5F6FA'; }}
                onMouseLeave={(e) => { if (value !== o.value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── New Card Modal ────────────────────────────────────────── */

const PRESET_COLORS = ['#1D9E75', '#3B6BCC', '#C26B1F', '#C53A6B', '#8B5CF6', '#1A1A1F'];

function NewCardModal({ onClose, onCreate, businessId, allowedCardTypes, isSuperadmin }: { onClose: () => void; onCreate: (c: Card) => void; businessId?: string; allowedCardTypes: string[]; isSuperadmin: boolean }) {
  const [name, setName] = useState('');
  const [cardType, setCardType] = useState('stamp');
  const [goalStamps, setGoalStamps] = useState(10);
  const [rewardDesc, setRewardDesc] = useState('');
  const [color, setColor] = useState('#1D9E75');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const { isPhone } = useBreakpoint();

  const handleCreate = async () => {
    if (!name.trim()) { setError('Card name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const result = await api.createCard({
        name: name.trim(),
        card_type: cardType,
        goal_stamps: goalStamps,
        reward_desc: rewardDesc.trim() || undefined,
        color,
        is_active: true,
        ...(businessId && businessId !== 'self' ? { business_id: businessId } : {}),
      });
      setDone(true);
      toast('Card created!', 'success');
      setTimeout(() => { onCreate(mapApiCard(result)); onClose(); }, 1000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create card';
      setError(msg);
      toast(msg, 'error');
      setSaving(false);
    }
  };

  return (
    <ResponsiveModal isOpen onClose={onClose} title="New loyalty card">
      {done ? (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 999, background: '#E8F7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Card created!</div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: isPhone ? '16px 20px' : 20, display: 'grid', gap: 14 }}>
            {error && (
              <div style={{ padding: '10px 14px', background: '#FBE2EC', borderRadius: 8, fontSize: 12, color: '#9C2848' }}>{error}</div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#5C5F66', display: 'block', marginBottom: 6 }}>Card name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coffee lovers"
                style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #EBEBEB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#5C5F66', display: 'block', marginBottom: 6 }}>Card type</label>
              {!isSuperadmin && allowedCardTypes.length === 1 && (
                <div style={{ marginBottom: 8, padding: '8px 12px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={12} /> Basic plan: stamp cards only. <span onClick={() => window.location.href = '/upgrade'} style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>Upgrade to Pro or Premium</span> for more card types.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isPhone ? 2 : 4},1fr)`, gap: 6 }}>
                {(['stamp', 'cashback', 'coupon', 'membership'] as const).map((t) => {
                  const m = typeMeta[t];
                  const isLocked = !isSuperadmin && !allowedCardTypes.includes(t);
                  return (
                    <button key={t} onClick={() => !isLocked && setCardType(t)} style={{
                      padding: isPhone ? '10px 4px' : '8px 4px',
                      border: `1px solid ${cardType === t ? color : isLocked ? '#F0F0F0' : '#EBEBEB'}`,
                      borderRadius: 8, background: cardType === t ? '#E8F7F2' : isLocked ? '#F9F9F9' : 'white',
                      cursor: isLocked ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 13,
                      color: cardType === t ? '#085041' : isLocked ? '#C0C0C0' : '#5C5F66',
                      fontWeight: cardType === t ? 500 : 400,
                      position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                      {isLocked && <Lock size={11} style={{ opacity: 0.5 }} />}
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {cardType === 'stamp' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#5C5F66', display: 'block', marginBottom: 6 }}>Goal stamps</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[5, 6, 7, 8, 10, 12].map((n) => (
                    <button key={n} onClick={() => setGoalStamps(n)} style={{
                      flex: 1, height: 36, border: `1px solid ${goalStamps === n ? color : '#EBEBEB'}`,
                      borderRadius: 8, background: goalStamps === n ? '#E8F7F2' : 'white',
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                      color: goalStamps === n ? '#085041' : '#5C5F66', fontWeight: goalStamps === n ? 600 : 400,
                    }}>{n}</button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#5C5F66', display: 'block', marginBottom: 6 }}>Reward description</label>
              <input value={rewardDesc} onChange={(e) => setRewardDesc(e.target.value)} placeholder="e.g. Free latte after 10 stamps"
                style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #EBEBEB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#5C5F66', display: 'block', marginBottom: 8 }}>Color</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {PRESET_COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)} style={{
                    width: 32, height: 32, borderRadius: 999, background: c, border: 'none', cursor: 'pointer',
                    outline: color === c ? `3px solid ${c}` : '3px solid transparent',
                    outlineOffset: 2,
                  }} />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
              <MiniCardArt card={{
                id: 'preview', name: name || 'Card name', biz: api.getBusinessName() || 'Your business',
                type: cardType, reward: rewardDesc || 'Your reward',
                gradient: CARD_COLORS[color] ?? [darkenHex(color), color],
                stamps: cardType === 'stamp' ? goalStamps : null,
                issued: 0, redemptions: 0,
              }} w={isPhone ? 280 : 320} h={isPhone ? 172 : 196} />
            </div>

            <button
              onClick={handleCreate}
              disabled={saving}
              style={{
                height: isPhone ? 52 : 40, background: saving ? '#8A8D94' : '#1D9E75', color: 'white',
                border: 0, borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {saving ? 'Creating…' : 'Create card'}
            </button>
          </div>
        </div>
      )}
    </ResponsiveModal>
  );
}

/* ─── Edit Card Modal ───────────────────────────────────────── */

function EditCardModal({ card, onClose, onUpdated }: { card: Card; onClose: () => void; onUpdated: (c: Card) => void }) {
  const [name, setName] = useState(card.name);
  const [cardType, setCardType] = useState(card.type);
  const [goalStamps, setGoalStamps] = useState(card.goal_stamps || 10);
  const [rewardDesc, setRewardDesc] = useState(card.reward);
  const [color, setColor] = useState(card.color);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { isPhone } = useBreakpoint();
  const { allowedCardTypes, isSuperadmin } = usePlan();

  const handleSave = async () => {
    if (!name.trim()) { setError('Card name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const result = await api.updateCard(card.id, {
        name: name.trim(),
        card_type: cardType,
        goal_stamps: goalStamps,
        reward_desc: rewardDesc.trim() || undefined,
        color,
      });
      const gradient = CARD_COLORS[result.color] ?? [darkenHex(result.color), result.color];
      onUpdated({ ...card, name: result.name, type: result.card_type, reward: result.reward_desc || '', color: result.color, gradient, goal_stamps: result.goal_stamps, stamps: result.card_type === 'stamp' ? result.goal_stamps : null });
      toast('Card saved!', 'success');
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update card';
      setError(msg);
      toast(msg, 'error');
      setSaving(false);
    }
  };

  return (
    <ResponsiveModal isOpen onClose={onClose} title="Edit loyalty card">
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: isPhone ? '16px 20px' : 20, display: 'grid', gap: 14 }}>
          {error && (
            <div style={{ padding: '10px 14px', background: '#FBE2EC', borderRadius: 8, fontSize: 12, color: '#9C2848' }}>{error}</div>
          )}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#5C5F66', display: 'block', marginBottom: 6 }}>Card name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coffee lovers"
              style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #EBEBEB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#5C5F66', display: 'block', marginBottom: 6 }}>Card type</label>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isPhone ? 2 : 4},1fr)`, gap: 6 }}>
              {(['stamp', 'cashback', 'coupon', 'membership'] as const).map((t) => {
                const m = typeMeta[t];
                const isLocked = !isSuperadmin && !allowedCardTypes.includes(t);
                return (
                  <button key={t} onClick={() => !isLocked && setCardType(t)} style={{
                    padding: isPhone ? '10px 4px' : '8px 4px',
                    border: `1px solid ${cardType === t ? color : isLocked ? '#F0F0F0' : '#EBEBEB'}`,
                    borderRadius: 8, background: cardType === t ? '#E8F7F2' : isLocked ? '#F9F9F9' : 'white',
                    cursor: isLocked ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 13,
                    color: cardType === t ? '#085041' : isLocked ? '#C0C0C0' : '#5C5F66',
                    fontWeight: cardType === t ? 500 : 400,
                    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}>
                    {isLocked && <Lock size={11} style={{ opacity: 0.5 }} />}
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
          {cardType === 'stamp' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#5C5F66', display: 'block', marginBottom: 6 }}>Goal stamps</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[5, 6, 7, 8, 10, 12].map((n) => (
                  <button key={n} onClick={() => setGoalStamps(n)} style={{
                    flex: 1, height: 36, border: `1px solid ${goalStamps === n ? color : '#EBEBEB'}`,
                    borderRadius: 8, background: goalStamps === n ? '#E8F7F2' : 'white',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                    color: goalStamps === n ? '#085041' : '#5C5F66', fontWeight: goalStamps === n ? 600 : 400,
                  }}>{n}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#5C5F66', display: 'block', marginBottom: 6 }}>
              {cardType === 'coupon' ? 'Offer description' : cardType === 'membership' ? 'Member benefits' : 'Reward description'}
            </label>
            <input value={rewardDesc} onChange={(e) => setRewardDesc(e.target.value)}
              placeholder={cardType === 'coupon' ? 'e.g. 감자튀김/고로케 무료' : 'e.g. Free latte after 10 stamps'}
              style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #EBEBEB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#5C5F66', display: 'block', marginBottom: 8 }}>Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRESET_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 32, height: 32, borderRadius: 999, background: c, border: 'none', cursor: 'pointer',
                  outline: color === c ? `3px solid ${c}` : '3px solid transparent',
                  outlineOffset: 2,
                }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
            <MiniCardArt card={{
              id: card.id, name: name || 'Card name', biz: api.getBusinessName() || 'Your business',
              type: cardType, reward: rewardDesc || 'Your reward',
              gradient: CARD_COLORS[color] ?? [darkenHex(color), color],
              stamps: cardType === 'stamp' ? goalStamps : null,
              issued: 0, redemptions: 0,
            }} w={isPhone ? 280 : 320} h={isPhone ? 172 : 196} />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              height: isPhone ? 52 : 40, background: saving ? '#8A8D94' : '#1D9E75', color: 'white',
              border: 0, borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}

/* ─── Delete Card Confirm ───────────────────────────────────── */

function DeleteCardConfirm({ card, onClose, onDeleted }: { card: Card; onClose: () => void; onDeleted: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const { isPhone } = useBreakpoint();
  async function handleDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.deleteCard(card.id);
      onDeleted(card.id);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete card';
      setDeleteError(msg);
      setDeleting(false);
    }
  }

  return (
    <ResponsiveModal isOpen onClose={onClose} title="Delete card" maxWidth={400}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: isPhone ? '16px 20px' : 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: '#FBE2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Trash2 size={24} color="#C53A6B" />
          </div>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Delete &ldquo;{card.name}&rdquo;?</div>
            <div style={{ fontSize: 13, color: '#5C5F66', lineHeight: 1.5 }}>
              This will permanently delete the card and all associated data. Customers will lose their stamps. This cannot be undone.
            </div>
          </div>
          {deleteError && (
            <div style={{ padding: '10px 14px', background: '#FBE2EC', borderRadius: 8, fontSize: 12, color: '#9C2848', marginBottom: 12 }}>
              {deleteError}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: isPhone ? 'column' : 'row', gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, height: isPhone ? 48 : 38, border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, height: isPhone ? 48 : 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: deleting ? '#8A8D94' : '#C53A6B', color: 'white', border: 0, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: deleting ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete card'}
            </button>
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}

/* ─── Card tile & table ────────────────────────────────────── */

function CardTile({ card, selected, onSelect }: { card: Card; selected: boolean; onSelect: () => void }) {
  const adoption = card.issued ? Math.round((card.active / card.issued) * 100) : 0;
  return (
    <div
      onClick={onSelect}
      style={{
        background: 'white', borderRadius: 16,
        border: `2px solid ${selected ? '#1D9E75' : 'transparent'}`,
        boxShadow: selected ? '0 0 0 2px #1D9E75, 0 1px 4px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        padding: 14, cursor: 'pointer',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 22px rgba(0,0,0,0.06)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 14px' }}>
        <MiniCardArt card={card} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>{card.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8A8D94' }}>
            <span style={{ color: card.bizColor, fontWeight: 500 }}>{card.biz}</span>
            <span>{String.fromCharCode(183)}</span>
            <TypePill type={card.type} />
          </div>
        </div>
        <StatusPill status={card.status} />
      </div>

      <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 12, borderTop: '1px solid #F0F0F2' }}>
        {([['Active', card.active], ['Issued', card.issued], ['Redeems', card.redemptions]] as [string, number][]).map(([l, v]) => (
          <div key={l} style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#8A8D94' }}>{l}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1, fontFamily: 'var(--font-mono)' }}>{v.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8A8D94', marginBottom: 4 }}>
          <span>Adoption</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{adoption}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 999, background: '#F0F0F2', overflow: 'hidden' }}>
          <div style={{ width: `${adoption}%`, height: '100%', background: card.bizColor, transition: 'width 400ms' }} />
        </div>
      </div>
    </div>
  );
}

function CardsTable({ rows, selectedId, onSelect }: { rows: Card[]; selectedId: string | null; onSelect: (c: Card) => void }) {
  const { isPhone } = useBreakpoint();
  const thStyle: React.CSSProperties = { padding: '12px 14px', textAlign: 'left', fontWeight: 500, fontSize: 11, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '0.04em' };
  const tdStyle: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' };
  if (isPhone) {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map((c) => (
          <div key={c.id} onClick={() => onSelect(c)} style={{
            background: 'white', borderRadius: 12,
            boxShadow: selectedId === c.id ? '0 0 0 2px #1D9E75, 0 1px 4px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
            padding: '12px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 40, height: 26, borderRadius: 6, background: `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})`, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                <TypePill type={c.type} />
                <StatusPill status={c.status} />
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{c.issued}</div>
              <div style={{ fontSize: 11, color: '#8A8D94' }}>issued</div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      <div className="table-scroll">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#FAFAFB' }}>
            <th style={thStyle}>Card</th>
            <th style={thStyle}>Business</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Status</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Active</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Issued</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Redeems</th>
            <th style={thStyle}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} onClick={() => onSelect(c)}
              style={{
                borderTop: '1px solid #F0F0F2',
                background: selectedId === c.id ? '#E8F7F2' : 'transparent',
                cursor: 'pointer', transition: 'background 100ms',
              }}
              onMouseEnter={(e) => { if (selectedId !== c.id) (e.currentTarget as HTMLElement).style.background = '#FAFAFB'; }}
              onMouseLeave={(e) => { if (selectedId !== c.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 36, height: 24, borderRadius: 5, background: `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})`, flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                </div>
              </td>
              <td style={{ ...tdStyle, color: c.bizColor, fontWeight: 500 }}>{c.biz}</td>
              <td style={tdStyle}><TypePill type={c.type} /></td>
              <td style={tdStyle}><StatusPill status={c.status} /></td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{c.active}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{c.issued}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{c.redemptions}</td>
              <td style={{ ...tdStyle, color: '#8A8D94' }}>{c.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function CardDetail({ card, onClose, onToggle, onEdit, onDelete }: { card: Card; onClose: () => void; onToggle: (id: string, active: boolean) => void; onEdit: (card: Card) => void; onDelete: (card: Card) => void }) {
  const [toggling, setToggling] = useState(false);
  const [cardStats, setCardStats] = useState<{ total_customers: number; total_stamps: number; total_redeems: number } | null>(null);

  useEffect(() => {
    api.cardStats(card.id)
      .then(setCardStats)
      .catch(() => {});
  }, [card.id]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await api.updateCard(card.id, { is_active: !card.is_active });
      onToggle(card.id, !card.is_active);
    } catch { /* silent */ } finally { setToggling(false); }
  };

  return (
    <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)', padding: 0, position: 'sticky', top: 84 }} className="fadeup">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #F0F0F2' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatusPill status={card.status} />
          <TypePill type={card.type} />
        </div>
        <button onClick={onClose} style={{ height: 26, width: 26, border: 0, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
          <X size={14} color="#5C5F66" />
        </button>
      </div>
      <div style={{ padding: 18 }}>
        <div style={{ fontSize: 11, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '.04em' }}>{card.biz}</div>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', marginTop: 2 }}>{card.name}</div>
        <div style={{ fontSize: 12, color: '#5C5F66', marginTop: 4 }}>{card.reward}</div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 4px' }}>
          <MiniCardArt card={card} w={280} h={172} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 14 }}>
          {([
            ['Customers', cardStats?.total_customers ?? card.active],
            ['Stamps', cardStats?.total_stamps ?? card.issued],
            ['Redeems', cardStats?.total_redeems ?? card.redemptions],
          ] as [string, number][]).map(([l, v]) => (
            <div key={l} style={{ padding: '10px 12px', border: '1px solid #F0F0F2', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#8A8D94' }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', fontFamily: 'var(--font-mono)' }}>{v.toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 14, background: '#FAFAFB', borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Total stamps</span>
            <span style={{ fontSize: 11, color: '#8A8D94', fontFamily: 'var(--font-mono)' }}>{cardStats?.total_stamps ?? 0} stamps</span>
          </div>
          <Sparkline values={[cardStats?.total_stamps ?? 0]} color={card.bizColor} w={290} h={36} />
        </div>
        <div style={{ fontSize: 12, color: '#8A8D94', marginTop: 14 }}>Updated {card.updated}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            onClick={handleToggle}
            disabled={toggling}
            style={{
              flex: 1, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: card.is_active ? '#FBE2EC' : '#1D9E75', color: card.is_active ? '#9C2848' : 'white',
              border: 0, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: toggling ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {toggling ? '…' : card.is_active ? 'Pause card' : 'Activate card'}
          </button>
          <button onClick={() => onEdit(card)} style={{ height: 34, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 5, border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
            <Pencil size={13} color="#5C5F66" />
          </button>
          <button onClick={() => onDelete(card)} style={{ height: 34, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 5, border: '1px solid #FBE2EC', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
            <Trash2 size={13} color="#C53A6B" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */

export default function CardsPage() {
  const { isMobile } = useBreakpoint();
  const { allowedCardTypes, isSuperadmin, cardLimit, isBasic, isPro, isPremium } = usePlan();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Card | null>(null);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [deleteCard, setDeleteCard] = useState<Card | null>(null);
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');

  useEffect(() => {
    api.cards()
      .then((cs) => { setAllCards(cs.map(mapApiCard)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.getBusinesses()
      .then((bs) => {
        setBusinesses(bs);
        if (bs.length === 1) setSelectedBusinessId(bs[0].id);
      })
      .catch(() => {
        // Single-business mode — enable create
        setSelectedBusinessId('self');
      });
  }, []);

  useEffect(() => {
    const handler = () => setShowModal(true);
    window.addEventListener('nook:cta', handler);
    return () => window.removeEventListener('nook:cta', handler);
  }, []);

  const filtered = useMemo(() => allCards.filter((c) => {
    if (type !== 'all' && c.type !== type) return false;
    if (status !== 'all' && c.status !== status) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.biz.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [type, status, search, allCards]);

  const totals = useMemo(() => ({
    total: filtered.length,
    active: filtered.filter((c) => c.status === 'active').length,
    issued: filtered.reduce((s, c) => s + c.issued, 0),
  }), [filtered]);

  const handleToggle = (id: string, newActive: boolean) => {
    setAllCards((prev) => prev.map((c) => c.id === id ? { ...c, is_active: newActive, status: newActive ? 'active' : 'paused' } : c));
    setSelected((prev) => prev?.id === id ? { ...prev, is_active: newActive, status: newActive ? 'active' : 'paused' } : prev);
  };

  const handleCardUpdated = (updated: Card) => {
    setAllCards((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    setSelected((prev) => prev?.id === updated.id ? updated : prev);
  };

  const handleCardDeleted = (id: string) => {
    setAllCards((prev) => prev.filter((c) => c.id !== id));
    setSelected((prev) => prev?.id === id ? null : prev);
  };

  return (
    <div style={{ padding: isMobile ? '16px' : '24px 28px', display: 'grid', gap: 18 }}>
      {showModal && (
        <NewCardModal
          businessId={selectedBusinessId}
          onClose={() => setShowModal(false)}
          onCreate={(c) => setAllCards((prev) => [c, ...prev])}
          allowedCardTypes={allowedCardTypes}
          isSuperadmin={isSuperadmin}
        />
      )}
      {editCard && (
        <EditCardModal
          card={editCard}
          onClose={() => setEditCard(null)}
          onUpdated={handleCardUpdated}
        />
      )}
      {deleteCard && (
        <DeleteCardConfirm
          card={deleteCard}
          onClose={() => setDeleteCard(null)}
          onDeleted={handleCardDeleted}
        />
      )}

      {/* Plan limit banner */}
      {!isSuperadmin && isPremium && (
        <div style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1px solid #93C5FD', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#1D4ED8' }}>
          <span style={{ fontSize: 15 }}>✨</span>
          <div><div style={{ fontWeight: 700 }}>Premium — Unlimited Cards & Customers</div><div style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>All card types · Unlimited customers · Unlimited push</div></div>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: '#2563EB', color: 'white', padding: '2px 8px', borderRadius: 20 }}>PREMIUM</span>
        </div>
      )}
      {!isSuperadmin && isBasic && (
        <div style={{ padding: '10px 16px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#92400E' }}>
          <Lock size={13} />
          <div><div style={{ fontWeight: 700 }}>Basic Plan</div><div style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>1 stamp card · 100 customers · push 1/month</div></div>
          <button onClick={() => window.location.href = '/upgrade'} style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, background: '#F59E0B', color: 'white', border: 0, padding: '4px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Upgrade</button>
        </div>
      )}
      {!isSuperadmin && isPro && (
        <div style={{ padding: '10px 16px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#14532D' }}>
          <Lock size={13} />
          <div><div style={{ fontWeight: 700 }}>Pro Plan</div><div style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>Up to 3 cards · 500 customers · push 1/week</div></div>
          <button onClick={() => window.location.href = '/upgrade'} style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, background: '#16A34A', color: 'white', border: 0, padding: '4px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Upgrade</button>
        </div>
      )}

      {/* Business Selector — only shown when multiple businesses exist */}
      {businesses.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: '10px 16px' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#5C5F66', flexShrink: 0 }}>Business</span>
          <select
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            style={{ flex: 1, height: 34, padding: '0 10px', border: '1px solid #EBEBEB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'white', color: '#1A1A1F', cursor: 'pointer' }}
          >
            <option value="">— Select a business —</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}
      {businesses.length > 1 && !selectedBusinessId && (
        <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#7C5700' }}>
          Select a business above before creating a card.
        </div>
      )}

      {/* Filter bar — search + 3 equal controls */}
      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)', padding: 12, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 12px', background: '#F5F6FA', borderRadius: 10 }}>
          <Search size={14} color="#8A8D94" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cards..."
            style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', fontSize: 13, fontFamily: 'inherit', color: '#1A1A1F' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ width: '100%' }}>
            <FilterDropdown label="Type" value={type} onChange={setType}
              options={[{ value: 'all', label: 'All' }, { value: 'stamp', label: 'Stamp' }, { value: 'coupon', label: 'Coupon' }, { value: 'cashback', label: 'Cashback' }, { value: 'membership', label: 'Membership' }]} />
          </div>
          <div style={{ width: '100%' }}>
            <FilterDropdown label="Status" value={status} onChange={setStatus}
              options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'paused', label: 'Paused' }]} />
          </div>
          <div style={{ display: 'flex', gap: 2, background: '#F0F1F4', borderRadius: 9, padding: 3 }}>
            {(['grid', 'list'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} style={{
                flex: 1, height: '100%', border: 0, borderRadius: 7,
                background: view === v ? 'white' : 'transparent',
                color: view === v ? '#1A1A1F' : '#5C5F66',
                fontSize: 12, fontWeight: view === v ? 500 : 400,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                textTransform: 'capitalize',
              }}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: (selected && !isMobile) ? '1fr 360px' : '1fr', gap: 16, alignItems: 'start' }}>
        <div>
          {loading ? (
            <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 48, textAlign: 'center', color: '#8A8D94', fontSize: 13 }}>
              Loading cards…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>No cards yet</div>
              <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 4 }}>Create your first loyalty card to get started.</div>
              <button onClick={() => setShowModal(true)} style={{ marginTop: 14, height: 34, padding: '0 16px', background: '#1D9E75', color: 'white', border: 0, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Plus size={14} /> New card
              </button>
            </div>
          ) : view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filtered.map((c) => (
                <CardTile key={c.id} card={c} selected={selected?.id === c.id} onSelect={() => setSelected(selected?.id === c.id ? null : c)} />
              ))}
            </div>
          ) : (
            <CardsTable rows={filtered} selectedId={selected?.id ?? null} onSelect={(c) => setSelected(selected?.id === c.id ? null : c)} />
          )}
        </div>
        {selected && !isMobile && <CardDetail card={selected} onClose={() => setSelected(null)} onToggle={handleToggle} onEdit={setEditCard} onDelete={setDeleteCard} />}
      </div>

      {isMobile && (
        selected && (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
            background: 'white', borderRadius: '16px 16px 0 0',
            border: '1px solid #EBEBEB', borderBottom: 'none',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
            maxHeight: '80vh', overflowY: 'auto',
          }}>
            <CardDetail card={selected} onClose={() => setSelected(null)} onToggle={handleToggle} onEdit={setEditCard} onDelete={setDeleteCard} />
          </div>
        )
      )}
    </div>
  );
}
