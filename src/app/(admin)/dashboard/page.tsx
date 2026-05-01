'use client';

import { useEffect, useState } from 'react';
import { trend30, redeem30, cardMix, bizActivity, activity, scheduledPush } from '@/lib/data';
import { api } from '@/lib/api';
import NookLineChart from '@/components/charts/NookLineChart';
import NookDonutChart from '@/components/charts/NookDonutChart';
import NookStackedBar from '@/components/charts/NookStackedBar';
import Sparkline from '@/components/charts/Sparkline';
import { Bell, Send, Users, Gift } from 'lucide-react';

const STAT_CARDS = [
  {
    label: 'Total customers', value: '284', deltaPct: '+6.8%', up: true,
    sub: 'across 4 businesses',
    spark: [210, 218, 225, 234, 241, 252, 260, 268, 275, 284], sparkColor: '#1D9E75',
    grad: 'linear-gradient(135deg, #DFF4EB 0%, #C7EBDB 100%)',
  },
  {
    label: 'Active cards', value: '359', deltaPct: '+7.2%', up: true,
    sub: 'in Apple / Google Wallet',
    spark: [280, 290, 298, 308, 318, 328, 338, 345, 352, 359], sparkColor: '#3B6BCC',
    grad: 'linear-gradient(135deg, #E2ECFB 0%, #CADCF7 100%)',
  },
  {
    label: 'Stamps issued', value: '2,517', deltaPct: '+14.1%', up: true,
    sub: 'last 30 days',
    spark: trend30, sparkColor: '#C26B1F',
    grad: 'linear-gradient(135deg, #FBEFD9 0%, #F6E0B5 100%)',
  },
  {
    label: 'Redemptions', value: '847', deltaPct: '−0.4%', up: false,
    sub: 'last 30 days',
    spark: redeem30, sparkColor: '#C53A6B',
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

export default function DashboardPage() {
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [cardCount, setCardCount] = useState<number | null>(null);

  useEffect(() => {
    api.customers().then((cs) => setCustomerCount(cs.length)).catch(() => {});
    api.cards().then((cs) => setCardCount(cs.filter((c) => c.is_active).length)).catch(() => {});
  }, []);

  const displayStats = STAT_CARDS.map((s, i) => {
    if (i === 0 && customerCount !== null) return { ...s, value: customerCount.toLocaleString() };
    if (i === 1 && cardCount !== null)     return { ...s, value: cardCount.toLocaleString() };
    return s;
  });

  return (
    <div style={{ padding: '24px 28px', display: 'grid', gap: 18 }}>
      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
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
                  <Users size={16} color="#1A1A1F" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.up ? '#0D6B45' : '#9C2848' }}>
                    {c.up ? '↑' : '↓'} {c.deltaPct}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(20,30,30,0.55)' }}>{c.sub}</span>
                </div>
                <Sparkline values={c.spark} color={c.sparkColor} w={70} h={22} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Row 2: line chart + donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16 }}>
        <ChartCard title="Stamp issuance" sub="Last 30 days">
          <NookLineChart stamps={trend30} redeems={redeem30} />
        </ChartCard>
        <ChartCard title="Card type mix" sub="Active cards by type">
          <NookDonutChart data={cardMix} />
        </ChartCard>
      </div>

      {/* Row 3: stacked bar + activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16 }}>
        <ChartCard title="Business activity" sub="Stamps + redemptions · 30 days">
          <NookStackedBar data={bizActivity} />
        </ChartCard>

        <Card style={{ padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px', borderBottom: '1px solid #F0F0F2' }}>
            <div>
              <div className="section-title">Recent activity</div>
              <div style={{ fontSize: 12, color: '#8A8D94' }}>Live across all businesses</div>
            </div>
            <button style={{ height: 28, padding: '0 10px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#5C5F66', fontFamily: 'inherit' }}>View all</button>
          </div>
          <div style={{ padding: '8px' }}>
            {activity.map((it, i) => {
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
                      <span style={{ color: '#8A8D94' }}> · {it.biz}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#5C5F66' }}>{it.detail}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#8A8D94', whiteSpace: 'nowrap' }}>{it.when}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Row 4: leaderboard + scheduled pushes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16 }}>
        <Card style={{ padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F0F0F2' }}>
            <div>
              <div className="section-title">Top businesses</div>
              <div style={{ fontSize: 12, color: '#8A8D94' }}>By engagement · last 30 days</div>
            </div>
          </div>
          <div style={{ padding: '10px 16px 14px' }}>
            {[...bizActivity]
              .map((d) => ({ ...d, total: d.stamps + d.redemptions }))
              .sort((a, b) => b.total - a.total)
              .map((r, i, arr) => (
                <div key={i} style={{ padding: '10px 4px', borderBottom: i < arr.length - 1 ? '1px solid #F0F0F2' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#8A8D94', width: 16 }}>#{i + 1}</span>
                      <span style={{
                        width: 22, height: 22, borderRadius: 6, background: r.color, color: 'white',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 600,
                      }}>{r.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{r.total.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 999, background: '#F0F0F2', overflow: 'hidden' }}>
                    <div style={{ width: `${(r.total / arr[0].total) * 100}%`, background: r.color, height: '100%', transition: 'width 400ms' }} />
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <Card style={{ padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F0F0F2' }}>
            <div>
              <div className="section-title">Scheduled pushes</div>
              <div style={{ fontSize: 12, color: '#8A8D94' }}>Next 7 days</div>
            </div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 5,
              height: 28, padding: '0 10px',
              background: '#1D9E75', color: 'white', border: 0, borderRadius: 8,
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Send size={13} /> New
            </button>
          </div>
          {scheduledPush.map((p, i) => (
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
                  {p.biz} · {p.when} · {p.reach} customers
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
