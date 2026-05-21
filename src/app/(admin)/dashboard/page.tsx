'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { scheduledPush } from '@/lib/data';
import { api } from '@/lib/api';
import NookLineChart from '@/components/charts/NookLineChart';
import NookDonutChart from '@/components/charts/NookDonutChart';
import Sparkline from '@/components/charts/Sparkline';
import { Bell, Send, Users, Gift, TrendingUp } from 'lucide-react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const CARD_TYPE_COLORS: Record<string, string> = {
  stamp:      '#1D9E75',
  coupon:     '#3B6BCC',
  membership: '#C53A6B',
  cashback:   '#C26B1F',
};

const STAT_CARDS = [
  {
    label: 'Total customers', value: '\u2014', deltaPct: '', up: true,
    sub: 'total customers',
    spark: [0], sparkColor: '#1D9E75',
    grad: 'linear-gradient(135deg, #DFF4EB 0%, #C7EBDB 100%)',
  },
  {
    label: 'Active cards', value: '\u2014', deltaPct: '', up: true,
    sub: 'active cards',
    spark: [0], sparkColor: '#3B6BCC',
    grad: 'linear-gradient(135deg, #E2ECFB 0%, #CADCF7 100%)',
  },
  {
    label: 'Stamps issued', value: '\u2014', deltaPct: '', up: true,
    sub: 'all time',
    spark: [0], sparkColor: '#C26B1F',
    grad: 'linear-gradient(135deg, #FBEFD9 0%, #F6E0B5 100%)',
  },
  {
    label: 'Redemptions', value: '\u2014', deltaPct: '', up: true,
    sub: 'all time',
    spark: [0], sparkColor: '#C53A6B',
    grad: 'linear-gradient(135deg, #FBE2EC 0%, #F6CCDD 100%)',
  },
];

function Card({ style, children }: { style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'white', borderRadius: 13,
      border: '1px solid #EBEBEB',
      ...style,
    }}>{children}</div>
  );
}

function ChartCard({ title, sub, children, padding = 20, right }: {
  title: string; sub?: string; children: React.ReactNode; padding?: number; right?: React.ReactNode;
}) {
  return (
    <Card style={{ padding: 0 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '16px 20px', borderBottom: '1px solid #F0F0F2',
      }}>
        <div>
          <div className="section-title">{title}</div>
          {sub && <div style={{ fontSize: 12, color: '#8A8D94', marginTop: 2 }}>{sub}</div>}
        </div>
        {right}
      </div>
      <div style={{ padding }}>{children}</div>
    </Card>
  );
}

const activityIcon: Record<string, { bg: string; c: string }> = {
  stamp:  { bg: 'linear-gradient(135deg, #FBEFD9, #F6E0B5)', c: '#8C5A11' },
  redeem: { bg: 'linear-gradient(135deg, #FBE2EC, #F6CCDD)', c: '#99355C' },
  signup: { bg: 'linear-gradient(135deg, #DFF4EB, #C7EBDB)', c: '#0D6B45' },
  push:   { bg: 'linear-gradient(135deg, #E2ECFB, #CADCF7)', c: '#1F4E94' },
};

const activityIconComp: Record<string, React.ElementType> = {
  stamp: Gift, redeem: Gift, signup: Users, push: Send,
};

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isMobile } = useBreakpoint();

  // KPI state
  const [customerCount,     setCustomerCount]     = useState<number | null>(null);
  const [cardCount,         setCardCount]         = useState<number | null>(null);
  const [totalStamps,       setTotalStamps]       = useState<number | null>(null);
  const [totalRedemptions,  setTotalRedemptions]  = useState<number | null>(null);

  // Chart state
  const [stampsTrend,      setStampsTrend]      = useState<number[]>([]);
  const [redeemsTrend,     setRedeemsTrend]     = useState<number[]>([]);
  const [cardTypeMix,      setCardTypeMix]      = useState<{ label: string; value: number; color: string }[]>([]);

  // Activity state (recent customer signups)
  const [recentActivity, setRecentActivity] = useState<
    { type: string; who: string; biz: string; when: string; detail: string }[]
  >([]);

  // ── KPI + charts from analytics ─────────────────────────────
  useEffect(() => {
    api.stats()
      .then((s) => {
        setCustomerCount(s.total_customers);
        setCardCount(s.active_cards);
        setTotalStamps(s.total_stamps);
        setTotalRedemptions(s.total_redemptions);
      })
      .catch(() => {
        api.customers().then((cs) => setCustomerCount(cs.length)).catch(() => {});
        api.cards().then((cs) => setCardCount(cs.filter((c) => c.is_active).length)).catch(() => {});
      });

    api.analytics()
      .then((a) => {
        if (a.stamps_daily_30d?.length) setStampsTrend(a.stamps_daily_30d);
        if (a.redemptions_daily_30d?.length) setRedeemsTrend(a.redemptions_daily_30d);
      })
      .catch(() => {});
  }, []);

  // ── Card type mix from real cards ────────────────────────────
  useEffect(() => {
    api.cards()
      .then((cards) => {
        const active = cards.filter((c) => c.is_active);
        const counts: Record<string, number> = {};
        active.forEach((c) => {
          const t = c.card_type || 'stamp';
          counts[t] = (counts[t] || 0) + 1;
        });
        const mix = Object.entries(counts).map(([type, count]) => ({
          label: type.charAt(0).toUpperCase() + type.slice(1),
          value: count,
          color: CARD_TYPE_COLORS[type] || '#8A8D94',
        }));
        if (mix.length > 0) setCardTypeMix(mix);
      })
      .catch(() => {});
  }, []);

  // ── Recent activity from customers ──────────────────────────
  useEffect(() => {
    api.customers()
      .then((cs) => {
        const sorted = [...cs].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const bizName = typeof window !== 'undefined' ? localStorage.getItem('nook_biz') ?? 'Nook' : 'Nook';
        const feed = sorted.slice(0, 8).map((c) => ({
          type:   'signup',
          who:    c.name,
          biz:    bizName,
          when:   timeAgo(c.created_at),
          detail: `New customer ${String.fromCharCode(183)} ${c.wallet_type !== 'unknown' ? 'Wallet added' : 'Registered'}`,
        }));
        if (feed.length > 0) setRecentActivity(feed);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => router.push('/cards');
    window.addEventListener('nook:cta', handler);
    return () => window.removeEventListener('nook:cta', handler);
  }, [router]);

  const displayStats = STAT_CARDS.map((s, i) => {
    if (i === 0 && customerCount !== null) return { ...s, value: customerCount.toLocaleString() };
    if (i === 1 && cardCount !== null)     return { ...s, value: cardCount.toLocaleString() };
    if (i === 2 && totalStamps !== null)   return { ...s, value: totalStamps.toLocaleString(), spark: stampsTrend.slice(-10).length ? stampsTrend.slice(-10) : s.spark };
    if (i === 3 && totalRedemptions !== null) return { ...s, value: totalRedemptions.toLocaleString(), spark: redeemsTrend.slice(-10).length ? redeemsTrend.slice(-10) : s.spark };
    return s;
  });

  // Fallback data when API hasn't returned yet
  const lineStamps  = stampsTrend.length > 1  ? stampsTrend  : Array(30).fill(0);
  const lineRedeems = redeemsTrend.length > 1 ? redeemsTrend : Array(30).fill(0);
  const donutData   = cardTypeMix.length > 0  ? cardTypeMix  : [{ label: 'Stamp', value: 1, color: '#1D9E75' }];
  const activityFeed = recentActivity.length > 0 ? recentActivity : [];

  return (
    <div style={{ padding: isMobile ? '16px' : '24px 28px', display: 'grid', gap: 18 }}>
      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: isMobile ? 10 : 16 }}>
        {displayStats.map((c, i) => (
          <Card key={i} style={{
            padding: 20,
            background: c.grad,
            border: '1px solid rgba(0,0,0,0.04)',
            animationDelay: `${i * 40}ms`,
          }}>
            <div className="fadeup">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(20,30,30,0.65)' }}>{c.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 8, color: '#1A1A1F' }}>
                    {c.value}
                  </div>
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'rgba(255,255,255,0.55)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TrendingUp size={16} color="#1A1A1F" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                <span style={{ fontSize: 11, color: 'rgba(20,30,30,0.55)' }}>{c.sub}</span>
                <Sparkline values={c.spark} color={c.sparkColor} w={70} h={22} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Row 2: line chart + donut */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.7fr 1fr', gap: 16 }}>
        <ChartCard title="Stamp issuance" sub={'Last 30 days \u2014 live data'}>
          <NookLineChart stamps={lineStamps} redeems={lineRedeems} />
        </ChartCard>
        <ChartCard title="Card type mix" sub="Active cards by type">
          <NookDonutChart data={donutData} />
        </ChartCard>
      </div>

      {/* Row 3: activity feed */}
      <Card style={{ padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px', borderBottom: '1px solid #F0F0F2' }}>
          <div>
            <div className="section-title">Recent signups</div>
            <div style={{ fontSize: 12, color: '#8A8D94' }}>Newest customers</div>
          </div>
          <button onClick={() => router.push('/customers')} style={{ height: 28, padding: '0 10px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#5C5F66', fontFamily: 'inherit' }}>View all</button>
        </div>
        <div style={{ padding: '8px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 0 }}>
          {activityFeed.length === 0 ? (
            <div style={{ padding: '20px 16px', color: '#8A8D94', fontSize: 13 }}>No customers yet</div>
          ) : activityFeed.map((it, i) => {
            const meta = activityIcon[it.type] ?? { bg: '#F0F1F4', c: '#5C5F66' };
            const Icon = activityIconComp[it.type] ?? Gift;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8, transition: 'background 120ms',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAFB')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: meta.bg, color: meta.c,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={15} color={meta.c} />
                </div>
                <div style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
                  <div style={{ fontSize: 13 }}>
                    <strong style={{ fontWeight: 600 }}>{it.who}</strong>
                    <span style={{ color: '#8A8D94' }}>{String.fromCharCode(32,183,32)}{it.biz}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#5C5F66' }}>{it.detail}</div>
                </div>
                <div style={{ fontSize: 11, color: '#8A8D94', whiteSpace: 'nowrap' }}>{it.when}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Row 4: scheduled pushes */}
      <Card style={{ padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F0F0F2' }}>
          <div>
            <div className="section-title">Scheduled pushes</div>
            <div style={{ fontSize: 12, color: '#8A8D94' }}>Next 7 days</div>
          </div>
          <button onClick={() => router.push('/push')} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            height: 28, padding: '0 10px',
            background: '#1D9E75', color: 'white', border: 0, borderRadius: 8,
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Send size={13} /> New
          </button>
        </div>
        {scheduledPush.length === 0 ? (
          <div style={{ padding: '20px', color: '#8A8D94', fontSize: 13 }}>No scheduled pushes</div>
        ) : scheduledPush.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
            borderBottom: i < scheduledPush.length - 1 ? '1px solid #F0F0F2' : 'none',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: p.status === 'draft' ? '#F0F1F4' : '#E8F7F2',
              color: p.status === 'draft' ? '#5C5F66' : '#085041',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bell size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</span>
                <span style={{
                  fontSize: 11, fontWeight: 500,
                  padding: '2px 8px', borderRadius: 999,
                  background: p.status === 'draft' ? '#F0F1F4' : '#E8F7F2',
                  color: p.status === 'draft' ? '#5C5F66' : '#085041',
                }}>{p.status === 'draft' ? 'Draft' : 'Scheduled'}</span>
              </div>
              <div style={{ fontSize: 12, color: '#8A8D94', marginTop: 2 }}>
                {p.biz}{String.fromCharCode(32,183,32)}{p.when}{String.fromCharCode(32,183,32)}{p.reach}{' customers'}
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
