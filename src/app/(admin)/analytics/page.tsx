'use client';

import { useState, useMemo } from 'react';
import { cohortRetention } from '@/lib/data';

const KPIS = [
  { label: '30-day retention',       value: '62%',   delta: '+4.2pp',  up: true },
  { label: 'Avg stamps / customer',  value: '8.9',   delta: '+0.6',    up: true },
  { label: 'Reward unlock rate',     value: '41%',   delta: '+2.1pp',  up: true },
  { label: 'Push CTR',               value: '62.4%', delta: '−0.8pp',  up: false },
];

const FUNNEL = [
  { l: 'QR scanned',         v: 482, pct: 100 },
  { l: 'Card added to wallet', v: 312, pct: 65 },
  { l: 'First stamp earned',  v: 268, pct: 56 },
  { l: 'Returning visit',     v: 198, pct: 41 },
  { l: 'Reward redeemed',     v: 87,  pct: 18 },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function KpiCard({ label, value, delta, up }: { label: string; value: string; delta: string; up?: boolean }) {
  return (
    <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 18 }}>
      <div style={{ fontSize: 12, color: '#8A8D94' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 11, marginTop: 4, color: up ? '#0D6B45' : '#8A8D94' }}>{delta}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState('overview');
  const heatmap = useMemo(() => Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => Math.random())), []);

  return (
    <div style={{ padding: '24px 28px', display: 'grid', gap: 16 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, background: '#F0F1F4', borderRadius: 9, padding: 3, width: 'fit-content' }}>
        {['overview', 'retention', 'funnel', 'engagement'].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            height: 26, padding: '0 12px', border: 0, borderRadius: 7,
            background: tab === t ? 'white' : 'transparent',
            color: tab === t ? '#1A1A1F' : '#5C5F66',
            fontSize: 12, fontWeight: tab === t ? 500 : 400,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {KPIS.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      {/* Cohort + Funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F2' }}>
            <div className="section-title">Cohort retention</div>
            <div style={{ fontSize: 12, color: '#8A8D94' }}>% of customers active in week N after signup</div>
          </div>
          <div style={{ padding: 18, overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 4 }}>
              <thead>
                <tr>
                  <th style={{ fontSize: 11, color: '#8A8D94', padding: 6, textAlign: 'left', fontWeight: 400 }}>Cohort</th>
                  {[0, 1, 2, 3, 4, 5, 6].map((w) => (
                    <th key={w} style={{ fontSize: 11, color: '#8A8D94', padding: 6, fontWeight: 400 }}>W{w}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortRetention.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 11, color: '#8A8D94', padding: 6, whiteSpace: 'nowrap' }}>Mar W{i + 1}</td>
                    {row.map((v, j) => (
                      <td key={j} style={{
                        width: 50, height: 32, textAlign: 'center', borderRadius: 4,
                        background: `oklch(${0.62 + (v / 100) * 0.18} 0.08 165 / ${0.18 + (v / 100) * 0.82})`,
                        color: v > 60 ? 'white' : '#1A1A1F',
                        fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-mono)',
                      }}>{v}%</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F2' }}>
            <div className="section-title">Customer funnel</div>
            <div style={{ fontSize: 12, color: '#8A8D94' }}>Last 30 days</div>
          </div>
          <div style={{ padding: 18, display: 'grid', gap: 14 }}>
            {FUNNEL.map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>{s.l}</span>
                  <span style={{ color: '#8A8D94', fontFamily: 'var(--font-mono)' }}>{s.v} · {s.pct}%</span>
                </div>
                <div style={{ height: 10, background: '#F0F0F2', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${s.pct}%`, height: '100%', background: '#1D9E75', opacity: 1 - i * 0.12, transition: 'width 400ms' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visit heatmap */}
      <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F2' }}>
          <div className="section-title">Visit heatmap</div>
          <div style={{ fontSize: 12, color: '#8A8D94' }}>Day of week × hour of day · last 90 days</div>
        </div>
        <div style={{ padding: 20, overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(24, 1fr)', gap: 3 }}>
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{ fontSize: 9, color: '#8A8D94', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{h}</div>
            ))}
            {heatmap.map((row, di) => (
              <>
                <div key={`l-${di}`} style={{ fontSize: 11, color: '#8A8D94', display: 'flex', alignItems: 'center' }}>{DAYS[di]}</div>
                {row.map((v, hi) => (
                  <div key={hi} style={{
                    height: 22, borderRadius: 3,
                    background: `oklch(0.95 0.04 165 / ${0.15 + v * 0.85})`,
                    cursor: 'default',
                  }} title={`${DAYS[di]} ${hi}:00 · ${Math.round(v * 40)} visits`} />
                ))}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
