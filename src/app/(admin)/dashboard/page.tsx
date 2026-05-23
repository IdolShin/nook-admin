'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { scheduledPush } from '@/lib/data';
import { api } from '@/lib/api';
import NookLineChart from '@/components/charts/NookLineChart';
import Sparkline from '@/components/charts/Sparkline';
import { Bell, Send, Users, CreditCard, Stamp, Gift, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { decodeToken } from '@/lib/permissions';

/* ── KPI card definitions ─────────────────────────────── */
const KPI_CONFIG = [
  { key: 'customers', label: 'Total customers', icon: Users,       iconBg: 'linear-gradient(135deg,#1D9E75,#085041)', iconColor: 'white', sparkColor: '#1D9E75' },
  { key: 'cards',     label: 'Active cards',    icon: CreditCard,  iconBg: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', iconColor: 'white', sparkColor: '#3B82F6' },
  { key: 'stamps',    label: 'Stamps issued',   icon: Gift,        iconBg: 'linear-gradient(135deg,#F59E0B,#D97706)', iconColor: 'white', sparkColor: '#F59E0B' },
  { key: 'redeems',   label: 'Redemptions',     icon: TrendingUp,  iconBg: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', iconColor: 'white', sparkColor: '#8B5CF6' },
];

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

/* ── Card wrapper ─────────────────────────────────────── */
function Card({ style, children }: { style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
      ...style,
    }}>{children}</div>
  );
}

/* ── Section header inside card ──────────────────────── */
function CardHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 20px 14px', borderBottom: '1px solid #F0F2F1' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1F', letterSpacing: '-0.01em' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: '#8A8D94', marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isMobile } = useBreakpoint();

  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [cardCount,     setCardCount]     = useState<number | null>(null);
  const [totalStamps,   setTotalStamps]   = useState<number | null>(null);
  const [totalRedeems,  setTotalRedeems]  = useState<number | null>(null);
  const [stampsTrend,   setStampsTrend]   = useState<number[]>([]);
  const [redeemsTrend,  setRedeemsTrend]  = useState<number[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ name: string; when: string; type: string }[]>([]);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const decoded = decodeToken();
      const isSuperadmin = decoded?.is_superadmin ?? false;
      if (isSuperadmin && decoded?.name) {
        setDisplayName(decoded.name);
      } else {
        setDisplayName(localStorage.getItem('nook_biz') ?? 'Nook');
      }
    }
    api.stats()
      .then(s => { setCustomerCount(s.total_customers); setCardCount(s.active_cards); setTotalStamps(s.total_stamps); setTotalRedeems(s.total_redemptions); })
      .catch(() => {});
    api.analytics()
      .then(a => { if (a.stamps_daily_30d?.length) setStampsTrend(a.stamps_daily_30d); if (a.redemptions_daily_30d?.length) setRedeemsTrend(a.redemptions_daily_30d); })
      .catch(() => {});
    api.customers()
      .then(cs => {
        const sorted = [...cs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecentActivity(sorted.slice(0, 6).map(c => ({ name: c.name, when: timeAgo(c.created_at), type: c.wallet_type !== 'unknown' ? 'wallet' : 'signup' })));
      })
      .catch(() => {});
  }, []);

  const kpiValues = [customerCount, cardCount, totalStamps, totalRedeems];
  const kpiSparks = [stampsTrend.slice(-10), [], stampsTrend.slice(-10), redeemsTrend.slice(-10)];

  const lineStamps  = stampsTrend.length > 1  ? stampsTrend  : Array(30).fill(0);
  const lineRedeems = redeemsTrend.length > 1 ? redeemsTrend : Array(30).fill(0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ padding: isMobile ? '16px' : '24px 28px', display: 'grid', gap: 20, alignContent: 'start' }}>

      {/* ── Page header ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#1A1A1F', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            {greeting()}, {displayName} {String.fromCharCode(128075)}
          </h1>
          <div style={{ fontSize: 13, color: '#8A8D94', marginTop: 4 }}>{todayLabel()}</div>
        </div>
        <button onClick={() => router.push('/cards')} style={{
          display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
          background: '#1D9E75', color: 'white', border: 0, borderRadius: 9,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 2px 8px rgba(29,158,117,0.35)', flexShrink: 0,
        }}>
          <CreditCard size={14} /> {!isMobile && 'New card'}
        </button>
      </div>

      {/* ── KPI row ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: isMobile ? 12 : 16 }}>
        {KPI_CONFIG.map((c, i) => {
          const val = kpiValues[i];
          const spark = kpiSparks[i] ?? [];
          const Icon = c.icon;
          return (
            <Card key={c.key} style={{ padding: '16px 18px 14px' }}>
              {/* Top row: icon + big number */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexShrink: 0 }}>
                  <Icon size={18} color={c.iconColor} />
                </div>
                <div style={{ fontSize: isMobile ? 26 : 28, fontWeight: 800, color: '#1A1A1F', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {val !== null ? val.toLocaleString() : '—'}
                </div>
              </div>
              {/* Bottom row: label + sparkline */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#5C5F66' }}>{c.label}</div>
                {spark.length > 1 && <Sparkline values={spark} color={c.sparkColor} w={56} h={20} />}
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Row 2: chart + quick stats ──────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.7fr 1fr', gap: 16 }}>

        {/* Stamp activity chart */}
        <Card style={{ padding: 0 }}>
          <CardHeader title="Stamp activity" sub="Last 30 days" right={
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#8A8D94' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 3, background: '#1D9E75', borderRadius: 2, display: 'inline-block' }} />Stamps</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 3, background: '#3B82F6', borderRadius: 2, display: 'inline-block' }} />Redeems</span>
            </div>
          } />
          <div style={{ padding: '16px 20px 20px' }}>
            <NookLineChart stamps={lineStamps} redeems={lineRedeems} />
          </div>
        </Card>

        {/* Quick stats */}
        <Card style={{ padding: 0 }}>
          <CardHeader title="Quick stats" sub="Your plan & overview" />
          <div style={{ padding: '8px 0' }}>
            {[
              { label: 'Plan', value: 'Starter', accent: '#1D9E75' },
              { label: 'Total customers', value: customerCount !== null ? customerCount.toLocaleString() : '—', accent: undefined },
              { label: 'Active cards', value: cardCount !== null ? String(cardCount) : '—', accent: undefined },
              { label: 'All-time stamps', value: totalStamps !== null ? totalStamps.toLocaleString() : '—', accent: undefined },
              { label: 'Redemptions', value: totalRedeems !== null ? String(totalRedeems) : '—', accent: undefined },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 20px', borderBottom: i < 4 ? '1px solid #F0F2F1' : 'none',
              }}>
                <span style={{ fontSize: 13, color: '#5C5F66' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: row.accent ?? '#1A1A1F' }}>{row.value}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #F0F2F1' }}>
            <button onClick={() => router.push('/analytics')} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', height: 34, border: '1px solid #EBEBEB',
              borderRadius: 8, background: 'transparent', cursor: 'pointer',
              fontSize: 12, color: '#5C5F66', fontFamily: 'inherit',
            }}>
              View full analytics <ArrowRight size={12} />
            </button>
          </div>
        </Card>
      </div>

      {/* ── Row 3: recent signups + scheduled pushes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 16 }}>

        {/* Recent signups */}
        <Card style={{ padding: 0 }}>
          <CardHeader title="Recent signups" sub="Newest customers" right={
            <button onClick={() => router.push('/customers')} style={{
              display: 'flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px',
              border: '1px solid #EBEBEB', borderRadius: 7, background: 'transparent',
              cursor: 'pointer', fontSize: 11, color: '#5C5F66', fontFamily: 'inherit',
            }}>View all <ArrowRight size={11} /></button>
          } />
          {recentActivity.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#8A8D94', fontSize: 13 }}>
              No customers yet — share your card QR to get started
            </div>
          ) : (
            <div>
              {recentActivity.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                  borderBottom: i < recentActivity.length - 1 ? '1px solid #F5F6FA' : 'none',
                  transition: 'background 120ms',
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFBFA')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 999, flexShrink: 0,
                    background: 'linear-gradient(135deg, #DFF4EB, #C7EBDB)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Users size={14} color="#085041" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: '#8A8D94', marginTop: 1 }}>New signup {String.fromCharCode(183)} {a.type === 'wallet' ? 'Wallet added' : 'Registered'}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#B0B3BB', flexShrink: 0 }}>{a.when}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Scheduled pushes */}
        <Card style={{ padding: 0 }}>
          <CardHeader title="Scheduled pushes" sub="Next 7 days" right={
            <button onClick={() => router.push('/push')} style={{
              display: 'flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px',
              background: '#1D9E75', color: 'white', border: 0, borderRadius: 7,
              fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Send size={11} /> New
            </button>
          } />
          {scheduledPush.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#8A8D94', fontSize: 13 }}>
              No scheduled pushes yet
            </div>
          ) : scheduledPush.map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
              borderBottom: i < scheduledPush.length - 1 ? '1px solid #F5F6FA' : 'none',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: p.status === 'draft' ? '#F0F1F4' : '#E8F7F2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bell size={14} color={p.status === 'draft' ? '#8A8D94' : '#085041'} />
              </div>
              <div style={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                <div style={{ fontSize: 11, color: '#8A8D94' }}>{p.when} {String.fromCharCode(183)} {p.reach} customers</div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 999,
                background: p.status === 'draft' ? '#F0F1F4' : '#E8F7F2',
                color: p.status === 'draft' ? '#8A8D94' : '#085041',
              }}>{p.status === 'draft' ? 'Draft' : 'Scheduled'}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
