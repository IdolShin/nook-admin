'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { customerStatusMeta } from '@/lib/utils';
import { api, type ApiCustomer, type ApiCouponPass, type ApiCoupon, type ApiRedemption } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Search, Gift, X, Ticket, Send, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import BottomSheet from '@/components/ui/BottomSheet';
import ResponsiveModal from '@/components/ui/ResponsiveModal';

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
  totalPoints: number | null;
  cardType: string;
  lastVisit: string;
  status: CustomerStatus;
  tags: string[];
}

const AVATAR_COLORS = ['#1D9E75', '#3B6BCC', '#C26B1F', '#C53A6B', '#1A1A1F', '#8B5CF6'];

function mapCustomer(c: ApiCustomer, i: number): Customer {
  const parts = c.name.trim().split(/\s+/);
  const initials = parts.map((w) => w[0]?.toUpperCase() ?? '').join('').slice(0, 2);
  const stamps = c.total_stamps ?? 0;
  const cardType = c.card_type || 'stamp';
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
    totalPoints: cardType === 'membership' ? (c.total_points ?? stamps * 100) : null,
    cardType,
    lastVisit: daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince}d ago`,
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
    <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)', padding: 16 }}>
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

/* âââ Coupon Picker Modal âââââââââââââââââââââââââââââââââââââ */


function CouponPickerModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [coupons, setCoupons] = useState<ApiCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    api.coupons()
      .then((cs) => setCoupons(cs.filter((c) => c.is_active)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleIssue = async (couponId: string) => {
    setIssuing(couponId);
    try {
      await api.issueCoupon(couponId, { customer_ids: [customer.id], send_push: true });
      setDone(couponId);
      setTimeout(onClose, 1400);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Failed to send', 'error');
      setIssuing(null);
    }
  };

  return (
    <ResponsiveModal isOpen onClose={onClose} title={`ì¿ í° ë°ì¡ — ${customer.name}`}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#8A8D94', fontSize: 13 }}>Loading…</div>
        ) : coupons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Ticket size={28} color="#EBEBEB" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>No active coupons</div>
            <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 4 }}>Create a coupon on the Coupons page first.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {coupons.map((coupon) => {
              const isSent = done === coupon.id;
              const isProcessing = issuing === coupon.id;
              return (
                <div key={coupon.id} style={{
                  padding: '12px 14px',
                  border: `1px solid ${isSent ? '#1D9E75' : '#EBEBEB'}`,
                  borderRadius: 10,
                  background: isSent ? '#E8F7F2' : 'white',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{coupon.title}</div>
                    <div style={{ fontSize: 12, color: '#5C5F66', marginTop: 2 }}>
                      {coupon.description || coupon.coupon_type} {String.fromCharCode(183)} {coupon.valid_days}ì¼ ì í¨
                    </div>
                  </div>
                  <button
                    onClick={() => handleIssue(coupon.id)}
                    disabled={!!issuing || !!done}
                    style={{
                      height: 32, padding: '0 14px', flexShrink: 0,
                      background: isSent ? '#1D9E75' : '#085041',
                      color: 'white', border: 'none', borderRadius: 8,
                      fontSize: 12, fontWeight: 600,
                      cursor: (isProcessing || !!done) ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', opacity: isProcessing ? 0.6 : 1,
                    }}
                  >
                    {isSent ? 'â ë°ì¡ë¨' : isProcessing ? '…' : 'ë°ì¡'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}

function CustomerDetail({ customer, onClose, onSendPush, onSendCoupon }: { customer: Customer; onClose: () => void; onSendPush?: () => void; onSendCoupon?: () => void }) {
  const visits = [3, 5, 4, 6, 7, 5, 8, 6, 7, 9, 8, 10];
  const [activeTab, setActiveTab] = useState<'activity' | 'redeems' | 'coupons'>('activity');
  const [passes, setPasses] = useState<ApiCouponPass[]>([]);
  const [passesLoading, setPassesLoading] = useState(false);
  const [redemptions, setRedemptions] = useState<ApiRedemption[]>([]);
  const [redeemsLoading, setRedeemsLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'coupons') return;
    setPassesLoading(true);
    api.couponPasses(customer.id)
      .then(setPasses)
      .catch(() => setPasses([]))
      .finally(() => setPassesLoading(false));
  }, [customer.id, activeTab]);

  useEffect(() => {
    if (activeTab !== 'redeems') return;
    setRedeemsLoading(true);
    api.customerRedemptions(customer.id)
      .then(setRedemptions)
      .catch(() => setRedemptions([]))
      .finally(() => setRedeemsLoading(false));
  }, [customer.id, activeTab]);

  return (
    <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)', padding: 0, position: 'sticky', top: 84 }} className="fadeup">
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
          <div style={{ padding: '10px 12px', border: '1px solid #F0F0F2', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#8A8D94' }}>Cards</div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', fontFamily: 'var(--font-mono)' }}>{customer.cards}</div>
          </div>
          <div style={{ padding: '10px 12px', border: '1px solid #F0F0F2', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#8A8D94' }}>{customer.cardType === 'membership' ? 'Points' : 'Stamps'}</div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', fontFamily: 'var(--font-mono)', color: customer.cardType === 'membership' ? '#6366F1' : undefined }}>
              {customer.cardType === 'membership' ? (customer.totalPoints?.toLocaleString() ?? 0) : customer.totalStamps}
              {customer.cardType === 'membership' && <span style={{ fontSize: 10, fontWeight: 400, color: '#8A8D94', marginLeft: 2 }}>pts</span>}
            </div>
          </div>
          <div style={{ padding: '10px 12px', border: '1px solid #F0F0F2', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#8A8D94' }}>Joined</div>
            <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '-0.01em', marginTop: 2, color: '#5C5F66' }}>{customer.joined}</div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 2, background: '#F0F1F4', borderRadius: 9, padding: 3, marginTop: 16 }}>
          {([['activity', 'Activity'], ['redeems', 'Redeems'], ['coupons', 'Coupons']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              flex: 1, height: 26, border: 0, borderRadius: 7,
              background: activeTab === id ? 'white' : 'transparent',
              color: activeTab === id ? '#1A1A1F' : '#5C5F66',
              fontSize: 11, fontWeight: activeTab === id ? 500 : 400,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: activeTab === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>{label}</button>
          ))}
        </div>

        {activeTab === 'activity' && (
          <>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>Visits {String.fromCharCode(183)} 12 weeks</span>
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
                  <span style={{ fontSize: 11, color: '#8A8D94', fontFamily: 'var(--font-mono)' }}>
                    {customer.cardType === 'membership'
                      ? `${(customer.totalPoints ?? 0).toLocaleString()} pts`
                      : `${Math.floor(customer.totalStamps / customer.biz.length)} stamps`}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'redeems' && (
          <div style={{ marginTop: 16 }}>
            {redeemsLoading ? (
              <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: '#8A8D94' }}>Loading…</div>
            ) : redemptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Gift size={28} color="#EBEBEB" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 12, color: '#8A8D94' }}>No redeems yet</div>
              </div>
            ) : (
              redemptions.map((r) => {
                const date = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const isPoints = r.redeem_type === 'points';
                return (
                  <div key={r.id} style={{
                    padding: '10px 12px', borderRadius: 10, marginBottom: 6,
                    border: '1px solid #F0F0F2',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {isPoints ? 'Points redeemed' : 'Stamp reward redeemed'}
                      </div>
                      <div style={{ fontSize: 11, color: '#8A8D94', marginTop: 2 }}>{date}</div>
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)',
                      color: isPoints ? '#6366F1' : '#1D9E75',
                    }}>
                      {isPoints
                        ? `−${r.points_redeemed?.toLocaleString()} pts`
                        : `−${r.stamps_redeemed ?? 10} stamps`}
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
                      {p.barcode} {String.fromCharCode(183)} Exp {expiryDate}
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
            <button onClick={onSendCoupon} style={{
              width: '100%', height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              border: '1px dashed #1D9E75', borderRadius: 8, background: 'transparent',
              cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', color: '#1D9E75', marginTop: 4, fontWeight: 500,
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
  const [showCouponPicker, setShowCouponPicker] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'stamps' | 'lastVisit' | 'status'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  useEffect(() => {
    api.customers()
      .then((cs) => {
        const mapped = cs.map(mapCustomer);
        setAllCustomers(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Topbar + button → go to add customer page
  useEffect(() => {
    const handler = () => router.push('/customers/add');
    window.addEventListener('nook:cta', handler);
    return () => window.removeEventListener('nook:cta', handler);
  }, [router]);

  const handleExportCSV = () => {
    const headers = ['Name', 'Phone', 'Status', 'Stamps', 'Points', 'Joined', 'Last Visit'];
    const csvRows = [
      headers.join(','),
      ...rows.map((c) => [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.phone}"`,
        c.status,
        c.totalStamps,
        c.cardType === 'membership' ? (c.totalPoints ?? 0) : '',
        `"${c.joined}"`,
        `"${c.lastVisit}"`,
      ].join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rows = useMemo(() => {
    const filtered = allCustomers.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q.toLowerCase()) && !c.phone.includes(q)) return false;
      if (seg === 'all') return true;
      if (seg === 'active') return c.status === 'active' || c.status === 'vip';
      return c.status === seg;
    });
    const STATUS_ORDER: Record<string, number> = { vip: 0, active: 1, new: 2, 'at-risk': 3 };
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name')      cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'stamps')    cmp = a.totalStamps - b.totalStamps;
      else if (sortBy === 'status')    cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      else if (sortBy === 'lastVisit') cmp = a.lastVisit.localeCompare(b.lastVisit);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [q, seg, allCustomers, sortBy, sortDir]);

  const vipCount    = allCustomers.filter((c) => c.status === 'vip').length;
  const newCount    = allCustomers.filter((c) => c.status === 'new').length;
  const atRiskCount = allCustomers.filter((c) => c.status === 'at-risk').length;

  const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: 11, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#FAFAFB' };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return <ChevronsUpDown size={11} style={{ opacity: 0.35, marginLeft: 3 }} />;
    return sortDir === 'asc' ? <ArrowUp size={11} style={{ color: '#1D9E75', marginLeft: 3 }} /> : <ArrowDown size={11} style={{ color: '#1D9E75', marginLeft: 3 }} />;
  };
  const thBtn: React.CSSProperties = { background: 'none', border: 0, padding: 0, fontFamily: 'inherit', fontWeight: 500, fontSize: 11, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center' };
  const tdStyle: React.CSSProperties = { padding: '12px 16px', verticalAlign: 'middle' };

  // Segment definitions — 4 equal colored tabs
  const SEG_DEFS = [
    { id: 'all',    label: 'All',      count: allCustomers.length,                                                                  activeBg: '#1D9E75', activeFg: 'white',   dot: '#1D9E75',  inactiveDot: '#8A8D94' },
    { id: 'new',    label: 'New',      count: allCustomers.filter((c) => c.status === 'new').length,                                activeBg: '#3B82F6', activeFg: 'white',   dot: '#3B82F6',  inactiveDot: '#8A8D94' },
    { id: 'active', label: 'Active',   count: allCustomers.filter((c) => c.status === 'active' || c.status === 'vip').length,       activeBg: '#085041', activeFg: 'white',   dot: '#1D9E75',  inactiveDot: '#8A8D94' },
    { id: 'at-risk',label: 'Inactive', count: allCustomers.filter((c) => c.status === 'at-risk').length,                           activeBg: '#E05050', activeFg: 'white',   dot: '#E05050',  inactiveDot: '#8A8D94' },
  ];

  return (
    <div style={{ padding: isMobile ? '16px' : '24px 28px', display: 'grid', gap: 16 }}>
      {showCouponPicker && selected && (
        <CouponPickerModal customer={selected} onClose={() => setShowCouponPicker(false)} />
      )}

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: isMobile ? 10 : 16 }}>
        <KPI label="Total customers" value={allCustomers.length.toString()} delta={`${allCustomers.length} registered`} up />
        <KPI label="New (30d)"       value={newCount.toString()}            delta="joined recently" up />
        <KPI label="Active"          value={allCustomers.filter((c) => c.status === 'active' || c.status === 'vip').length.toString()} delta="returning customers" />
        <KPI label="Inactive"        value={atRiskCount.toString()}         delta="no visit in 14d" warn />
      </div>

      {/* Search + 4-segment filter */}
      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)', padding: 12, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 12px', background: '#F5F6FA', borderRadius: 10 }}>
          <Search size={14} color="#8A8D94" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or phone..."
            style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', fontSize: 13, fontFamily: 'inherit', color: '#1A1A1F' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {SEG_DEFS.map((s) => {
            const isActive = seg === s.id;
            return (
              <button key={s.id} onClick={() => setSeg(s.id)} style={{
                height: 52, border: 0, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                background: isActive ? s.activeBg : 'white',
                color: isActive ? s.activeFg : '#5C5F66',
                boxShadow: isActive ? `0 2px 8px ${s.dot}40` : '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                transition: 'all 130ms',
              }}>
                <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>{s.count}</span>
                <span style={{ fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: isActive ? 'rgba(255,255,255,0.7)' : s.inactiveDot, display: 'inline-block' }} />
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: (selected && !isMobile) ? '1fr 380px' : '1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#8A8D94', fontSize: 13 }}>Loading customers…</div>
          ) : rows.length === 0 && !q ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>No customers yet</div>
              <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 4 }}>Customers appear when they register a loyalty card.</div>
            </div>
          ) : (
          <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Businesses</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Cards</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Stamps</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Points</th>
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
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)', color: c.cardType === 'membership' ? '#6366F1' : '#8A8D94' }}>
                      {c.cardType === 'membership' ? `${(c.totalPoints ?? 0).toLocaleString()} pts` : '—'}
                    </td>
                    <td style={{ ...tdStyle, color: '#8A8D94' }}>{c.lastVisit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          )}
        </div>
        {selected && !isMobile && <CustomerDetail customer={selected} onClose={() => setSelected(null)} onSendPush={() => router.push('/push')} onSendCoupon={() => setShowCouponPicker(true)} />}
      </div>

      {isMobile && (
        <BottomSheet
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          bottomOffset="calc(60px + env(safe-area-inset-bottom))"
          maxHeight="82vh"
        >
          {selected && <CustomerDetail customer={selected} onClose={() => setSelected(null)} onSendPush={() => router.push('/push')} onSendCoupon={() => setShowCouponPicker(true)} />}
        </BottomSheet>
      )}
    </div>
  );
}
