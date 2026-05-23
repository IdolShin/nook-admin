'use client';

import { useState, useEffect, useMemo } from 'react';
import { api, type ApiCoupon } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Plus, X, ChevronRight, Send, Gift, Zap, Calendar, Users, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import ResponsiveModal from '@/components/ui/ResponsiveModal';

// ─── Mock fallback data ────────────────────────────────────────
const MOCK_COUPONS: ApiCoupon[] = [
  { id: 'c1', title: 'Weekend 20% Off', description: 'Valid all weekend on any purchase', coupon_type: 'percent', discount_value: 20, color: '#1D9E75', trigger_type: 'manual', is_active: true, total_issued: 128, total_redeemed: 47, valid_days: 14, created_at: '2026-04-15T00:00:00Z' },
  { id: 'c2', title: 'Free Coffee Welcome', description: 'For new customers on their first visit', coupon_type: 'free_item', free_item_name: 'coffee', color: '#3B6BCC', trigger_type: 'manual', is_active: true, total_issued: 56, total_redeemed: 23, valid_days: 30, created_at: '2026-04-10T00:00:00Z' },
  { id: 'c3', title: 'Birthday Treat', description: 'Special gift on your birthday month', coupon_type: 'free_item', free_item_name: 'pastry', color: '#C53A6B', trigger_type: 'birthday', is_active: true, total_issued: 12, total_redeemed: 8, valid_days: 30, created_at: '2026-04-01T00:00:00Z' },
  { id: 'c4', title: 'Winback $5 Off', description: "For customers who haven't visited in 30 days", coupon_type: 'fixed', discount_value: 5, color: '#C26B1F', trigger_type: 'winback', is_active: false, total_issued: 34, total_redeemed: 19, valid_days: 7, created_at: '2026-03-20T00:00:00Z' },
];

const RECENT_ACTIVITY = [
  { name: 'Sarah Chen',  coupon: 'Weekend 20% Off',    when: '4 min ago', type: 'redeemed' },
  { name: 'Min-jae Kim', coupon: 'Free Coffee Welcome', when: '22 min ago', type: 'issued' },
  { name: 'James Cho',   coupon: 'Birthday Treat',     when: '1h ago',    type: 'redeemed' },
  { name: 'Olivia Rocha',coupon: 'Weekend 20% Off',    when: '2h ago',    type: 'redeemed' },
  { name: 'David Park',  coupon: 'Free Coffee Welcome', when: '3h ago',    type: 'issued' },
];

// ─── Helpers ──────────────────────────────────────────────────
const TYPE_META: Record<string, { emoji: string; label: string; bg: string; text: string }> = {
  percent:   { emoji: '\u{1F3F7}\uFE0F',  label: '% Discount', bg: '#E8F7F2', text: '#085041' },
  fixed:     { emoji: '💵',  label: '$ Off',      bg: '#E2ECFB', text: '#1F4E94' },
  bogo:      { emoji: '\u{1F381}',  label: 'BOGO',       bg: '#FBEFD9', text: '#8C5A11' },
  free_item: { emoji: '\u2615',  label: 'Free Item',  bg: '#F0F1F4', text: '#5C5F66' },
  review:    { emoji: '\u2B50',  label: 'Review',     bg: '#FBE2EC', text: '#9C2848' },
  custom:    { emoji: '✨',  label: 'Custom',     bg: '#F5F6FA', text: '#5C5F66' },
};

const TRIGGER_META: Record<string, { label: string; bg: string; text: string }> = {
  manual:         { label: 'Manual',          bg: '#F0F1F4', text: '#5C5F66' },
  birthday:       { label: 'Birthday',        bg: '#FBE2EC', text: '#9C2848' },
  stamp_complete: { label: 'Stamp complete',  bg: '#E8F7F2', text: '#085041' },
  winback:        { label: 'Winback 30d',     bg: '#FBEFD9', text: '#8C5A11' },
  scheduled:      { label: 'Scheduled',       bg: '#E2ECFB', text: '#1F4E94' },
};

const COUPON_TYPE_OPTIONS = [
  { type: 'percent',   emoji: '\u{1F3F7}\uFE0F', label: '% Discount', desc: 'Take N% off any purchase' },
  { type: 'fixed',     emoji: '💵', label: '$ Off',      desc: 'Fixed dollar amount off' },
  { type: 'bogo',      emoji: '\u{1F381}', label: 'BOGO',       desc: 'Buy one, get one free' },
  { type: 'free_item', emoji: '\u2615', label: 'Free Item',  desc: 'Specific free item reward' },
  { type: 'review',    emoji: '\u2B50', label: 'Google Review', desc: 'Reward for leaving a review' },
  { type: 'custom',    emoji: '✨', label: 'Custom',     desc: 'Write your own offer' },
];

const BRAND_COLORS = ['#1D9E75', '#3B6BCC', '#C26B1F', '#C53A6B', '#1A1A1F', '#8B5CF6'];

function discountText(c: ApiCoupon) {
  if (c.coupon_type === 'percent')   return `${c.discount_value}% off`;
  if (c.coupon_type === 'fixed')     return `$${c.discount_value} off`;
  if (c.coupon_type === 'free_item') return `Free ${c.free_item_name || 'item'}`;
  if (c.coupon_type === 'bogo')      return 'BOGO';
  if (c.coupon_type === 'review')    return '\u2B50 Review';
  return c.title;
}

// ─── Toggle switch ────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 34, height: 20, borderRadius: 999, flexShrink: 0,
        background: on ? '#1D9E75' : '#E0E1E6', position: 'relative',
        cursor: 'pointer', transition: 'background 150ms',
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: 999, background: 'white',
        position: 'absolute', top: 2,
        left: on ? 16 : 2,
        transition: 'left 150ms',
        boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
      }} />
    </div>
  );
}

// ─── Coupon card row ──────────────────────────────────────────
function CouponRow({ coupon, onToggle, onIssue }: {
  coupon: ApiCoupon;
  onToggle: () => void;
  onIssue: () => void;
}) {
  const { isPhone } = useBreakpoint();
  const tm = TYPE_META[coupon.coupon_type] ?? TYPE_META.custom;
  const trm = TRIGGER_META[coupon.trigger_type] ?? TRIGGER_META.manual;
  const redemptionRate = coupon.total_issued > 0 ? Math.round((coupon.total_redeemed / coupon.total_issued) * 100) : 0;

  if (isPhone) {
    return (
      <div style={{
        background: 'white', borderRadius: 13,
        border: '1px solid #EBEBEB',
        borderLeft: `4px solid ${coupon.color}`,
        padding: '14px 14px',
        opacity: coupon.is_active ? 1 : 0.65,
        transition: 'opacity 200ms',
      }}>
        {/* Top row: icon + title + discount */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: tm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{tm.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{coupon.title}</div>
            <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 999, background: tm.bg, color: tm.text }}>{tm.label}</span>
              <span style={{ fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 999, background: trm.bg, color: trm.text }}>{trm.label}</span>
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: coupon.color, flexShrink: 0 }}>
            {discountText(coupon)}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#8A8D94', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
          <span>{coupon.total_issued} issued</span>
          <span>{String.fromCharCode(183)}</span>
          <span>{coupon.total_redeemed} redeemed</span>
          <span>{String.fromCharCode(183)}</span>
          <span>{redemptionRate}%</span>
          <span>{String.fromCharCode(183)}</span>
          <span>{coupon.valid_days}d valid</span>
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F5F5F5', paddingTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Toggle on={coupon.is_active} onChange={onToggle} />
            <span style={{ fontSize: 12, color: '#8A8D94' }}>{coupon.is_active ? 'Active' : 'Paused'}</span>
          </div>
          <button onClick={onIssue} style={{
            height: 34, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 5,
            background: '#1D9E75', color: 'white', border: 0, borderRadius: 8,
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Send size={13} /> Issue
          </button>
        </div>
      </div>
    );
  }

  // Desktop layout (unchanged)
  return (
    <div style={{
      background: 'white', borderRadius: 13,
      border: '1px solid #EBEBEB',
      borderLeft: `4px solid ${coupon.color}`,
      padding: '16px 18px',
      display: 'flex', alignItems: 'center', gap: 16,
      opacity: coupon.is_active ? 1 : 0.65,
      transition: 'opacity 200ms',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: tm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{tm.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>{coupon.title}</span>
          <span style={{ fontSize: 11, fontWeight: 500, padding: '1px 7px', borderRadius: 999, background: tm.bg, color: tm.text }}>{tm.label}</span>
          <span style={{ fontSize: 11, fontWeight: 500, padding: '1px 7px', borderRadius: 999, background: trm.bg, color: trm.text }}>{trm.label}</span>
        </div>
        {coupon.description && (
          <div style={{ fontSize: 12, color: '#5C5F66', marginBottom: 6, lineHeight: 1.4 }}>{coupon.description}</div>
        )}
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#8A8D94' }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{coupon.total_issued} issued</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{coupon.total_redeemed} redeemed</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{redemptionRate}% redemption</span>
          <span>Valid {coupon.valid_days}d</span>
        </div>
      </div>
      <div style={{ textAlign: 'right', minWidth: 80, flexShrink: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', color: coupon.color }}>{discountText(coupon)}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Toggle on={coupon.is_active} onChange={onToggle} />
        <button onClick={onIssue} style={{
          height: 30, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 5,
          background: '#1D9E75', color: 'white', border: 0, borderRadius: 8,
          fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Send size={12} /> Issue
        </button>
      </div>
    </div>
  );
}

// ─── Create Coupon Modal ───────────────────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: ApiCoupon) => void }) {
  const [step, setStep] = useState(1);
  const [couponType, setCouponType] = useState('percent');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [freeItemName, setFreeItemName] = useState('');
  const [terms, setTerms] = useState('');
  const [color, setColor] = useState('#1D9E75');
  const [validDays, setValidDays] = useState('30');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [triggerType, setTriggerType] = useState('manual');
  const [sendPush, setSendPush] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const [result, setResult] = useState<{ issued: number } | null>(null);
  const { isPhone } = useBreakpoint();

  const previewDiscount = couponType === 'percent' ? `${discountValue || '0'}% off`
    : couponType === 'fixed' ? `$${discountValue || '0'} off`
    : couponType === 'free_item' ? `Free ${freeItemName || 'item'}`
    : TYPE_META[couponType]?.label || 'Coupon';

  async function handleCreate() {
    if (!title.trim()) { setCreateError('Coupon title is required'); return; }
    setSaving(true);
    setCreateError('');
    try {
      const coupon = await api.createCoupon({
        title, description, coupon_type: couponType,
        discount_value: discountValue ? Number(discountValue) : undefined,
        free_item_name: freeItemName || undefined,
        terms: terms || undefined,
        color, valid_days: Number(validDays) || 30,
        max_redemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
        trigger_type: triggerType,
      });
      const res = await api.issueCoupon(coupon.id, { send_push: sendPush, send_email: sendEmail });
      setResult({ issued: res.issued });
      onCreated(coupon);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create coupon';
      setCreateError(msg);
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', fontSize: 13, fontFamily: 'inherit',
    border: '1px solid #EBEBEB', borderRadius: 8, outline: 'none',
    background: 'white', color: '#1A1A1F', boxSizing: 'border-box',
  };

  return (
    <ResponsiveModal isOpen onClose={onClose} maxWidth={640}>
      {/* Header with step indicator */}
      <div style={{ padding: isPhone ? '16px 20px' : '20px 24px', borderBottom: '1px solid #F0F0F2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: isPhone ? 16 : 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
            {result ? 'Coupon issued!' : `Create coupon — Step ${step} of 3`}
          </div>
          <div style={{ fontSize: 12, color: '#8A8D94', marginTop: 2 }}>
            {step === 1 ? 'Choose type and set details' : step === 2 ? 'Configure settings' : 'Issue to customers'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{ width: s === step ? 20 : 8, height: 8, borderRadius: 999, background: s <= step ? '#1D9E75' : '#E0E1E6', transition: 'all 200ms' }} />
            ))}
          </div>
          <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: isPhone ? 44 : 28, minHeight: isPhone ? 44 : 28, borderRadius: 6 }}>
            <X size={isPhone ? 18 : 16} color="#5C5F66" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: isPhone ? '16px 20px' : '22px 24px', overflowY: 'auto', flex: 1 }}>
        {result ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: 999, background: '#E8F7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Coupon created & issued</div>
            <div style={{ fontSize: 14, color: '#5C5F66', marginTop: 6 }}>Sent to {result.issued} customers {String.fromCharCode(183)} passes now in their wallets</div>
            <button onClick={onClose} style={{ marginTop: 24, height: 44, padding: '0 24px', background: '#1D9E75', color: 'white', border: 0, borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
          </div>
        ) : step === 1 ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Coupon type</div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isPhone ? 2 : 3}, 1fr)`, gap: 8 }}>
                {COUPON_TYPE_OPTIONS.map((opt) => (
                  <button key={opt.type} onClick={() => setCouponType(opt.type)} style={{
                    padding: '12px', border: `2px solid ${couponType === opt.type ? '#1D9E75' : '#EBEBEB'}`,
                    borderRadius: 10, background: couponType === opt.type ? '#E8F7F2' : 'white',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  }}>
                    <div style={{ fontSize: 20 }}>{opt.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: couponType === opt.type ? '#085041' : '#1A1A1F' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: '#8A8D94', marginTop: 2, lineHeight: 1.3 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Title</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekend 20% off" style={inputStyle} />
            </div>
            {(couponType === 'percent' || couponType === 'fixed') && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{couponType === 'percent' ? 'Discount %' : 'Discount amount ($)'}</div>
                <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={couponType === 'percent' ? '20' : '5'} style={inputStyle} />
              </div>
            )}
            {couponType === 'free_item' && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Free item name</div>
                <input value={freeItemName} onChange={(e) => setFreeItemName(e.target.value)} placeholder="e.g. coffee, pastry" style={inputStyle} />
              </div>
            )}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Description <span style={{ color: '#8A8D94', fontWeight: 400 }}>(optional)</span></div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Short description shown on the coupon pass" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Terms <span style={{ color: '#8A8D94', fontWeight: 400 }}>(optional)</span></div>
              <input value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="e.g. One per customer, not combinable" style={inputStyle} />
            </div>
          </div>
        ) : step === 2 ? (
          <div style={{ display: 'grid', gap: 18 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Coupon color</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {BRAND_COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)} style={{
                    width: 36, height: 36, borderRadius: 10, background: c,
                    border: `3px solid ${color === c ? '#1A1A1F' : 'transparent'}`,
                    cursor: 'pointer', outline: 'none',
                  }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Valid for (days)</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[7, 14, 30, 60].map((d) => (
                    <button key={d} onClick={() => setValidDays(String(d))} style={{
                      flex: 1, height: 36, border: `1px solid ${validDays === String(d) ? '#1D9E75' : '#EBEBEB'}`,
                      borderRadius: 8, background: validDays === String(d) ? '#E8F7F2' : 'white',
                      color: validDays === String(d) ? '#085041' : '#1A1A1F',
                      cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                    }}>{d}d</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Max redemptions <span style={{ color: '#8A8D94', fontWeight: 400 }}>(optional)</span></div>
                <input type="number" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} placeholder="Unlimited" style={inputStyle} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Trigger</div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isPhone ? 2 : 3}, 1fr)`, gap: 6 }}>
                {Object.entries(TRIGGER_META).map(([key, meta]) => (
                  <button key={key} onClick={() => setTriggerType(key)} style={{
                    padding: '9px 12px', border: `1px solid ${triggerType === key ? '#1D9E75' : '#EBEBEB'}`,
                    borderRadius: 8, background: triggerType === key ? '#E8F7F2' : 'white',
                    color: triggerType === key ? '#085041' : '#1A1A1F',
                    cursor: 'pointer', fontSize: 12, fontWeight: triggerType === key ? 500 : 400, fontFamily: 'inherit',
                    textAlign: 'left',
                  }}>{meta.label}</button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Preview</div>
              <div style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
                borderRadius: 12, padding: '18px 20px', color: 'white',
              }}>
                <div style={{ fontSize: 11, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '.06em' }}>Coupon</div>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 6 }}>{previewDiscount}</div>
                <div style={{ fontSize: 15, fontWeight: 500, marginTop: 4 }}>{title || 'Coupon title'}</div>
                {description && <div style={{ fontSize: 12, opacity: 0.75, marginTop: 3 }}>{description}</div>}
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.7 }}>
                  <span>Valid {validDays}d from issue</span>
                  <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '.06em' }}>123456789012</span>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Audience</div>
              <div style={{ padding: '10px 14px', background: '#E8F7F2', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={14} color="#0D6B45" />
                <span style={{ fontSize: 13, color: '#0D6B45', fontWeight: 500 }}>All customers of this business</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Delivery channels</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {[
                  { key: 'push', label: 'Push notification', desc: 'Wallet + lock screen', enabled: sendPush, toggle: () => setSendPush(!sendPush) },
                  { key: 'email', label: 'Email', desc: 'Requires customer email on file', enabled: sendEmail, toggle: () => setSendEmail(!sendEmail) },
                ].map((ch) => (
                  <div key={ch.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid #EBEBEB', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{ch.label}</div>
                      <div style={{ fontSize: 11, color: '#8A8D94' }}>{ch.desc}</div>
                    </div>
                    <Toggle on={ch.enabled} onChange={ch.toggle} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {!result && (
        <div style={{ flexShrink: 0 }}>
          {createError && (
            <div style={{ margin: '0 24px', padding: '10px 14px', background: '#FBE2EC', borderRadius: 8, fontSize: 12, color: '#9C2848' }}>
              {createError}
            </div>
          )}
          <div style={{
            padding: isPhone ? '12px 20px' : '14px 24px',
            borderTop: '1px solid #F0F0F2',
            display: 'flex',
            flexDirection: isPhone ? 'column-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: isPhone ? 'stretch' : 'center',
            gap: isPhone ? 8 : 0,
            paddingBottom: isPhone ? 'max(12px, env(safe-area-inset-bottom))' : undefined,
          }}>
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            style={{ height: isPhone ? 48 : 34, padding: '0 14px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !title}
              style={{
                height: isPhone ? 48 : 34, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                background: (step === 1 && !title) ? '#8A8D94' : '#1D9E75', color: 'white',
                border: 0, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: title ? 'pointer' : 'default', fontFamily: 'inherit',
              }}
            >
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving}
              style={{
                height: isPhone ? 48 : 34, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                background: saving ? '#8A8D94' : '#1D9E75', color: 'white',
                border: 0, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
              }}
            >
              <Send size={13} /> {saving ? 'Creating…' : 'Create & issue'}
            </button>
          )}
          </div>
        </div>
      )}
    </ResponsiveModal>
  );
}

// ─── Issue confirm panel ───────────────────────────────────────
function IssuePanel({ coupon, onClose, onDone }: { coupon: ApiCoupon; onClose: () => void; onDone: () => void }) {
  const [issuing, setIssuing] = useState(false);
  const [result, setResult] = useState<{ issued: number; skipped: number } | null>(null);
  const [issueError, setIssueError] = useState('');
  const { isPhone } = useBreakpoint();

  async function handleIssue() {
    setIssuing(true);
    setIssueError('');
    try {
      const res = await api.issueCoupon(coupon.id, { send_push: true });
      setResult({ issued: res.issued, skipped: res.skipped });
      onDone();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to issue coupon';
      setIssueError(msg);
      toast(msg, 'error');
    }
    setIssuing(false);
  }

  return (
    <ResponsiveModal isOpen onClose={onClose} title="Issue coupon" maxWidth={400}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: isPhone ? '16px 20px' : 24 }}>
          {result ? (
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <div style={{ width: 56, height: 56, borderRadius: 999, background: '#E8F7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Issued!</div>
              <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 4 }}>{result.issued} passes sent {String.fromCharCode(183)} {result.skipped} skipped (already had pass)</div>
              <button onClick={onClose} style={{ marginTop: 18, height: 44, padding: '0 20px', background: '#1D9E75', color: 'white', border: 0, borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#5C5F66', marginBottom: 20, lineHeight: 1.5 }}>Issue <strong>{coupon.title}</strong> to all customers who don&apos;t already have an active pass.</div>
              {issueError && (
                <div style={{ padding: '10px 14px', background: '#FBE2EC', borderRadius: 8, fontSize: 12, color: '#9C2848', marginBottom: 12 }}>
                  {issueError}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: isPhone ? 'column' : 'row', gap: 8 }}>
                <button onClick={onClose} style={{ flex: 1, height: isPhone ? 48 : 38, padding: '0 12px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={handleIssue} disabled={issuing} style={{ flex: 1, height: isPhone ? 48 : 38, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: issuing ? '#8A8D94' : '#1D9E75', color: 'white', border: 0, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: issuing ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                  <Send size={13} /> {issuing ? 'Issuing…' : 'Issue to all'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </ResponsiveModal>
  );
}

// ─── Main page ─────────────────────────────────────────────────
export default function CouponsPage() {
  const { isMobile } = useBreakpoint();
  const [coupons, setCoupons] = useState<ApiCoupon[]>(MOCK_COUPONS);
  const [showCreate, setShowCreate] = useState(false);
  const [issueTarget, setIssueTarget] = useState<ApiCoupon | null>(null);
  const [triggers, setTriggers] = useState({ birthday: true, winback: true, stamp_complete: true });

  useEffect(() => {
    api.coupons().then((cs) => { if (cs.length > 0) setCoupons(cs); }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => setShowCreate(true);
    window.addEventListener('nook:cta', handler);
    return () => window.removeEventListener('nook:cta', handler);
  }, []);

  async function handleToggle(coupon: ApiCoupon) {
    const updated = { ...coupon, is_active: !coupon.is_active };
    setCoupons((prev) => prev.map((c) => c.id === coupon.id ? updated : c));
    try { await api.updateCoupon(coupon.id, { is_active: !coupon.is_active }); }
    catch { setCoupons((prev) => prev.map((c) => c.id === coupon.id ? coupon : c)); }
  }

  const totalIssued    = coupons.reduce((s, c) => s + (c.total_issued || 0), 0);
  const totalRedeemed  = coupons.reduce((s, c) => s + (c.total_redeemed || 0), 0);
  const activeCoupons  = coupons.filter((c) => c.is_active).length;

  const STAT_CARDS = [
    { label: 'Active coupons',   value: activeCoupons.toString(),   sub: `of ${coupons.length} total`,     grad: 'linear-gradient(135deg, #DFF4EB 0%, #C7EBDB 100%)' },
    { label: 'Passes issued',    value: totalIssued.toString(),     sub: 'all time',                       grad: 'linear-gradient(135deg, #E2ECFB 0%, #CADCF7 100%)' },
    { label: 'Redeemed',         value: totalRedeemed.toString(),   sub: 'total redemptions',              grad: 'linear-gradient(135deg, #FBEFD9 0%, #F6E0B5 100%)' },
    { label: 'Redemption rate',  value: totalIssued ? `${Math.round((totalRedeemed / totalIssued) * 100)}%` : '—', sub: 'of all issued passes', grad: 'linear-gradient(135deg, #FBE2EC 0%, #F6CCDD 100%)' },
  ];

  return (
    <div style={{ padding: isMobile ? '16px' : '24px 28px', display: 'grid', gap: 16 }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#1A1A1F', letterSpacing: '-0.025em', lineHeight: 1.2 }}>Coupons</h1>
          <div style={{ fontSize: 13, color: '#8A8D94', marginTop: 4 }}>Create and manage loyalty rewards</div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
          background: '#1D9E75', color: 'white', border: 0, borderRadius: 9,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 2px 8px rgba(29,158,117,0.35)', flexShrink: 0,
        }}>
          + New coupon
        </button>
      </div>
      {/* KPI stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: isMobile ? 10 : 16 }}>
        {STAT_CARDS.map((s, i) => (
          <div key={i} style={{ background: s.grad, borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 20 }} className="fadeup">
            <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(20,30,30,0.65)' }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 8, color: '#1A1A1F' }}>{s.value}</div>
            <div style={{ fontSize: 11, marginTop: 4, color: 'rgba(20,30,30,0.55)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Main body */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 16, alignItems: 'start' }}>
        {/* Left: coupon list */}
        <div style={{ display: 'grid', gap: 10 }}>
          {coupons.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)', padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>No coupons yet</div>
              <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 4 }}>Create your first coupon to start issuing passes.</div>
              <button onClick={() => setShowCreate(true)} style={{ marginTop: 16, height: 36, padding: '0 16px', background: '#1D9E75', color: 'white', border: 0, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Create coupon
              </button>
            </div>
          ) : (
            coupons.map((coupon) => (
              <CouponRow
                key={coupon.id}
                coupon={coupon}
                onToggle={() => handleToggle(coupon)}
                onIssue={() => setIssueTarget(coupon)}
              />
            ))
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: 'grid', gap: 12, position: 'sticky', top: 84 }}>
          {/* Create button */}
          <button
            onClick={() => setShowCreate(true)}
            style={{
              width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#1D9E75', color: 'white', border: 0, borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Plus size={16} /> Create coupon
          </button>

          {/* Auto-triggers */}
          <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)', padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #F0F0F2' }}>
              <div className="section-title">Auto-triggers</div>
              <div style={{ fontSize: 11, color: '#8A8D94', marginTop: 2 }}>Issue coupons automatically</div>
            </div>
            <div style={{ padding: '6px 18px 14px' }}>
              {[
                { key: 'birthday' as const,       label: 'Birthday coupons', desc: 'Issue on birthday month' },
                { key: 'winback' as const,        label: 'Winback (30-day)', desc: 'No visit in 30+ days' },
                { key: 'stamp_complete' as const, label: 'Stamp complete',   desc: 'When a card is completed' },
              ].map((t) => (
                <div key={t.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F0F0F2' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: '#8A8D94' }}>{t.desc}</div>
                  </div>
                  <Toggle on={triggers[t.key]} onChange={() => setTriggers((prev) => ({ ...prev, [t.key]: !prev[t.key] }))} />
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)', padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #F0F0F2' }}>
              <div className="section-title">Recent redemptions</div>
            </div>
            <div style={{ padding: '4px 0 8px' }}>
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px' }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                    background: a.type === 'redeemed' ? '#E8F7F2' : '#F0F1F4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {a.type === 'redeemed' ? <Gift size={14} color="#0D6B45" /> : <Send size={13} color="#5C5F66" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, lineHeight: 1.3 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: '#8A8D94', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.coupon}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#8A8D94', whiteSpace: 'nowrap' }}>{a.when}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => setCoupons((prev) => [c, ...prev])}
        />
      )}
      {issueTarget && (
        <IssuePanel
          coupon={issueTarget}
          onClose={() => setIssueTarget(null)}
          onDone={() => api.coupons().then((cs) => { if (cs.length > 0) setCoupons(cs); }).catch(() => {})}
        />
      )}
    </div>
  );
}
