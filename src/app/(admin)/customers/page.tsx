'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { customerStatusMeta } from '@/lib/utils';
import { api, type ApiCustomer, type ApiCouponPass } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Search, Download, Send, Gift, X, Ticket } from 'lucide-react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

type CustomerStatus = 'vip' | 'active' | 'new' | 'at-risk';

interface Customer {
  id: string;
  name: string;
  initials: string;
  color: string;
  phone: string;
  joined: string;
  biz: string[];
  cards: number;
  totalStamps: number;
  lastVisit: string;
  spend: number;
  status: CustomerStatus;
  tags: string[];
}

const AVATAR_COLORS = ['#1D9E75', '#3B6BCC', '#C26B1F', '#C53A6B', '#1A1A1F', '#8B5CF6'];

function mapCustomer(c: ApiCustomer, i: number): Customer {
  const parts = c.name.trim().split(/\s+/);
  const initials = parts.map((w) => w[0]?.toUpperCase() ?? '').join('').slice(0, 2);
  const stamps = c.total_stamps ?? 0;
  const daysSince = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86_400_000);
  const status: CustomerStatus = stamps > 20 ? 'vip' : daysSince < 30 ? 'new' : 'active';
  return {
    id: c.id,
    name: c.name,
    initials,
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    phone: c.phone,
    joined: new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    biz: [api.getBusinessName() || 'Nook Café'],
    cards: 1,
    totalStamps: stamps,
    lastVisit: daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince}d ago`,
    spend: 0,
    status,
    tags: [],
  };
}

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

const PASS_STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  active:   { label: 'Active',   bg: '#E8F7F2', fg: '#085041' },
  redeemed: { label: 'Redeemed', bg: '#F0F1F4', fg: '#5C5F66' },
  expired:  { label: 'Expired',  bg: '#FBE2EC', fg: '#9C2848' },
};

function CustomerDetail({ customer, onClose, onSendPush }: { customer: Customer; onClose: () => void; onSendPush?: () => void }) {
  const visits = [3, 5, 4, 6, 7, 5, 8, 6, 7, 9, 8, 10];
  const [activeTab, setActiveTab] = useState<'activity' | 'coupons'>('activity');
  const [passes, setPasses] = useState<ApiCouponPass[]>([]);
  const [passesLoading, setPassesLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'coupons') return;
    setPassesLoading(true);
    api.couponPasses(customer.id)
      .then(setPasses)
      .catch(() => setPasses([]))
      .finally(() => setPassesLoading(false));
  }, [customer.id, activeTab]);

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

        {customer.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {customer.tags.map((t, i) => (
              <span key={i} style={{ fontSize: 11, padding: '2px 8px', background: '#F0F1F4', borderRadius: 999, color: '#5C5F66' }}>#{t}</span>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 14 }}>
          {[['Cards', customer.cards.toString()], ['Stamps', customer.totalStamps.toString()], ['Spend', `$${customer.spend}`]].map(([l, v]) => (
            <div key={l} style={{ padding: '10px 12px', border: '1px solid #F0F0F2', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#8A8D94' }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', fontFamily: 'var(--font-mono)' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 2, background: '#F0F1F4', borderRadius: 9, padding: 3, marginTop: 16 }}>
          {([['activity', 'Activity'], ['coupons', 'Coupons']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              flex: 1, height: 26, border: 0, borderRadius: 7,
              background: activeTab === id ? 'white' : 'transparent',
              color: activeTab === id ? '#1A1A1F' : '#5C5F66',
              fontSize: 12, fontWeight: activeTab === id ? 500 : 400,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: activeTab === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>{label}</button>
          ))}
        </div>

        {activeTab === 'activity' && (
          <>
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
          </>
        )}

        {activeTab === 'coupons' && (
          <div style={{ marginTop: 16 }}>
            {passesLoading ? (
              <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: '#8A8D94' }}>Loading…</div>
            ) : passes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Ticket size={28} color="#EBEBEB" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 12, color: '#8A8D94' }}>No coupon passes yet</div>
              </div>
            ) : (
              passes.map((p) => {
                const meta = PASS_STATUS[p.status] ?? PASS_STATUS.active;
                const coupon = p.coupons;
                const expiryDate = new Date(p.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div key={p.id} style={{ padding: '10px 12px', border: '1px solid #F0F0F2', borderRadius: 10, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{coupon?.title ?? 'Coupon'}</div>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: meta.bg, color: meta.fg }}>{meta.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#8A8D94', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                      {p.barcode} · Exp {expiryDate}
                    </div>
                    {p.redeemed_at && (
                      <div style={{ fontSize: 11, color: '#8A8D94', marginTop: 2 }}>
                        Redeemed {new Date(p.redeemed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <button style={{
              width: '100%', height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              border: '1px dashed #EBEBEB', borderRadius: 8, background: 'transparent',
              cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', color: '#5C5F66', marginTop: 4,
            }}>
              <Ticket size={13} /> Send coupon
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onSendPush} style={{ flex: 1, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#1D9E75', color: 'white', border: 0, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Send size={13} /> Send push
          </button>
          <button onClick={() => toast('Navigate to the Scanner page to redeem a reward', 'info')} style={{ height: 34, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 5, border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
            <Gift size={13} color="#5C5F66" /> Reward
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const router = useRouter();
  const { isMobile } = useBreakpoint();
  const [q, setQ] = useState('');
  const [seg, setSeg] = useState('all');
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.customers()
      .then((cs) => {
        const mapped = cs.map(mapCustomer);
        setAllCustomers(mapped);
        if (mapped.length > 0) setSelected(mapped[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const segs = [
    { id: 'all',     label: 'All',            count: allCustomers.length },
    { id: 'vip',     label: 'VIP',            count: allCustomers.filter((c) => c.status === 'vip').length },
    { id: 'new',     label: 'New (30d)',       count: allCustomers.filter((c) => c.status === 'new').length },
    { id: 'at-risk', label: 'At risk',        count: allCustomers.filter((c) => c.status === 'at-risk').length },
    { id: 'multi',   label: 'Multi-business', count: allCustomers.filter((c) => c.biz.length > 1).length },
  ];

  const rows = useMemo(() => allCustomers.filter((c) => {
    if (q && !c.name.toLowerCase().includes(q.toLowerCase()) && !c.phone.includes(q)) return false;
    if (seg === 'all') return true;
    if (seg === 'multi') return c.biz.length > 1;
    return c.status === seg;
  }), [q, seg, allCustomers]);

  const vipCount    = allCustomers.filter((c) => c.status === 'vip').length;
  const newCount    = allCustomers.filter((c) => c.status === 'new').length;
  const atRiskCount = allCustomers.filter((c) => c.status === 'at-risk').length;

  const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: 11, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#FAFAFB' };
  const tdStyle: React.CSSProperties = { padding: '12px 16px', verticalAlign: 'middle' };

  return (
    <div style={{ padding: isMobile ? '16px' : '24px 28px', display: 'grid', gap: 16 }}>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: isMobile ? 10 : 16 }}>
        <KPI label="Total customers" value={allCustomers.length.toString()} delta={`${allCustomers.length} total`} up />
        <KPI label="VIPs"            value={vipCount.toString()}            delta={`${allCustomers.length ? ((vipCount / allCustomers.length) * 100).toFixed(1) : 0}% of base`} />
        <KPI label="New (30d)"       value={newCount.toString()}            delta="joined in last 30 days" up />
        <KPI label="At-risk"         value={atRiskCount.toString()}         delta="No visit in 14d" warn />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 10px', background: '#F5F6FA', borderRadius: 8, flex: '1 1 280px', minWidth: 220 }}>
          <Search size={14} color="#8A8D94" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, phone…"
            style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', fontSize: 13, fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'flex', gap: 2, background: '#F0F1F4', borderRadius: 9, padding: 3 }}>
          {segs.map((s) => (
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
        <button onClick={() => router.push('/push')} style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
          <Send size={13} color="#5C5F66" /> Message segment
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
          <Download size={13} color="#5C5F66" /> Export CSV
        </button>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: (selected && !isMobile) ? '1fr 380px' : '1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#8A8D94', fontSize: 13 }}>Loading customers…</div>
          ) : rows.length === 0 && !q ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>No customers yet</div>
              <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 4 }}>Customers appear when they register a loyalty card.</div>
            </div>
          ) : (
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
          )}
        </div>
        {selected && !isMobile && <CustomerDetail customer={selected} onClose={() => setSelected(null)} onSendPush={() => router.push('/push')} />}
      </div>

      {/* Mobile detail bottom sheet */}
      {isMobile && selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.4)' }} />
          <div style={{
            position: 'fixed', bottom: 60, left: 0, right: 0, zIndex: 50,
            maxHeight: '80vh', overflowY: 'auto',
            background: 'white', borderRadius: '16px 16px 0 0',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
          }}>
            <CustomerDetail customer={selected} onClose={() => setSelected(null)} onSendPush={() => router.push('/push')} />
          </div>
        </>
      )}
    </div>
  );
}
