'use client';

import { useState, useMemo } from 'react';
import { customers as CUSTOMERS } from '@/lib/data';
import { customerStatusMeta } from '@/lib/utils';
import { Search, Download, Send, Gift, X } from 'lucide-react';

type Customer = typeof CUSTOMERS[number];

function StatusPill({ status }: { status: string }) {
  const s = customerStatusMeta[status] ?? customerStatusMeta.active;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 500,
      padding: '2px 8px', borderRadius: 999,
      background: s.bg, color: s.fg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />
      {s.label}
    </span>
  );
}

function KPI({ label, value, delta, up, warn }: { label: string; value: string; delta: string; up?: boolean; warn?: boolean }) {
  return (
    <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 16 }}>
      <div style={{ fontSize: 12, color: '#8A8D94' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 11, marginTop: 6, color: warn ? '#9C2848' : up ? '#0D6B45' : '#8A8D94' }}>{delta}</div>
    </div>
  );
}

function CustomerDetail({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const s = customerStatusMeta[customer.status] ?? customerStatusMeta.active;
  const visits = [3, 5, 4, 6, 7, 5, 8, 6, 7, 9, 8, 10];

  return (
    <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 0, position: 'sticky', top: 84 }} className="fadeup">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #F0F0F2' }}>
        <StatusPill status={customer.status} />
        <button onClick={onClose} style={{ height: 26, width: 26, border: 0, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={14} color="#5C5F66" />
        </button>
      </div>
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 999, flexShrink: 0,
            background: customer.color, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 600,
          }}>{customer.initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>{customer.name}</div>
            <div style={{ fontSize: 12, color: '#8A8D94', fontFamily: 'var(--font-mono)' }}>{customer.phone}</div>
            <div style={{ fontSize: 12, color: '#8A8D94', marginTop: 2 }}>Joined {customer.joined}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
          {customer.tags.map((t, i) => (
            <span key={i} style={{ fontSize: 11, padding: '2px 8px', background: '#F0F1F4', borderRadius: 999, color: '#5C5F66' }}>#{t}</span>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 14 }}>
          {[['Cards', customer.cards.toString()], ['Stamps', customer.totalStamps.toString()], ['Spend', `$${customer.spend}`]].map(([l, v]) => (
            <div key={l} style={{ padding: '10px 12px', border: '1px solid #F0F0F2', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#8A8D94' }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', fontFamily: 'var(--font-mono)' }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Visits · 12 weeks</span>
            <span style={{ fontSize: 11, color: '#8A8D94', fontFamily: 'var(--font-mono)' }}>{visits.reduce((a, b) => a + b, 0)} total</span>
          </div>
          <div style={{ display: 'flex', gap: 3, height: 40, alignItems: 'flex-end' }}>
            {visits.map((v, i) => (
              <div key={i} style={{
                flex: 1, height: `${(v / Math.max(...visits)) * 100}%`,
                background: customer.color, borderRadius: 2,
                opacity: 0.65 + (i / visits.length) * 0.35,
              }} />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Cards in wallet</div>
          {customer.biz.map((b, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', border: '1px solid #F0F0F2', borderRadius: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>{b}</span>
              <span style={{ fontSize: 11, color: '#8A8D94', fontFamily: 'var(--font-mono)' }}>{Math.floor(customer.totalStamps / customer.biz.length)} stamps</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button style={{ flex: 1, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#1D9E75', color: 'white', border: 0, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Send size={13} /> Send push
          </button>
          <button style={{ height: 34, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 5, border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
            <Gift size={13} color="#5C5F66" /> Reward
          </button>
        </div>
      </div>
    </div>
  );
}

const SEGS = [
  { id: 'all', label: 'All', count: CUSTOMERS.length },
  { id: 'vip', label: 'VIP', count: CUSTOMERS.filter((c) => c.status === 'vip').length },
  { id: 'new', label: 'New (30d)', count: CUSTOMERS.filter((c) => c.status === 'new').length },
  { id: 'at-risk', label: 'At risk', count: CUSTOMERS.filter((c) => c.status === 'at-risk').length },
  { id: 'multi', label: 'Multi-business', count: CUSTOMERS.filter((c) => c.biz.length > 1).length },
];

export default function CustomersPage() {
  const [q, setQ] = useState('');
  const [seg, setSeg] = useState('all');
  const [selected, setSelected] = useState<Customer>(CUSTOMERS[0]);

  const rows = useMemo(() => CUSTOMERS.filter((c) => {
    if (q && !c.name.toLowerCase().includes(q.toLowerCase()) && !c.phone.includes(q)) return false;
    if (seg === 'all') return true;
    if (seg === 'multi') return c.biz.length > 1;
    return c.status === seg;
  }), [q, seg]);

  const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: 11, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#FAFAFB' };
  const tdStyle: React.CSSProperties = { padding: '12px 16px', verticalAlign: 'middle' };

  return (
    <div style={{ padding: '24px 28px', display: 'grid', gap: 16 }}>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <KPI label="Total customers" value="284" delta="+18 this week" up />
        <KPI label="VIPs" value="32" delta="11.3% of base" />
        <KPI label="New (30d)" value="46" delta="+12% MoM" up />
        <KPI label="At-risk" value="9" delta="No visit in 14d" warn />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 10px', background: '#F5F6FA', borderRadius: 8, flex: '1 1 280px', minWidth: 220 }}>
          <Search size={14} color="#8A8D94" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, phone…"
            style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', fontSize: 13, fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'flex', gap: 2, background: '#F0F1F4', borderRadius: 9, padding: 3 }}>
          {SEGS.map((s) => (
            <button key={s.id} onClick={() => setSeg(s.id)} style={{
              height: 26, padding: '0 10px', border: 0, borderRadius: 7,
              background: seg === s.id ? 'white' : 'transparent',
              color: seg === s.id ? '#1A1A1F' : '#5C5F66',
              fontSize: 12, fontWeight: seg === s.id ? 500 : 400,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: seg === s.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {s.label}
              <span style={{ fontSize: 10, color: '#8A8D94' }}>{s.count}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
          <Send size={13} color="#5C5F66" /> Message segment
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
          <Download size={13} color="#5C5F66" /> Export CSV
        </button>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }}>
        <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Businesses</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Cards</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Stamps</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Spend</th>
                <th style={thStyle}>Last visit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const isSel = selected?.id === c.id;
                return (
                  <tr key={c.id} onClick={() => setSelected(c)} style={{
                    borderTop: '1px solid #F0F0F2',
                    background: isSel ? '#E8F7F2' : 'transparent',
                    cursor: 'pointer', transition: 'background 100ms',
                  }}
                    onMouseEnter={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = '#FAFAFB'; }}
                    onMouseLeave={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 999, background: c.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{c.initials}</div>
                        <div style={{ lineHeight: 1.3 }}>
                          <div style={{ fontWeight: 500 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: '#8A8D94', fontFamily: 'var(--font-mono)' }}>{c.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}><StatusPill status={c.status} /></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {c.biz.map((b, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '1px 7px', background: '#F0F1F4', borderRadius: 999 }}>{b}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{c.cards}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{c.totalStamps}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${c.spend}</td>
                    <td style={{ ...tdStyle, color: '#8A8D94' }}>{c.lastVisit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {selected && <CustomerDetail customer={selected} onClose={() => setSelected(CUSTOMERS[0])} />}
      </div>
    </div>
  );
}
