'use client';

import { useState, useEffect, useMemo } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { decodeToken, canView } from '@/lib/permissions';
import { api, type ApiBusiness } from '@/lib/api';
import { Lock, TrendingUp, TrendingDown, Users, Gift, Ticket, RefreshCw, ChevronDown } from 'lucide-react';

interface AnalyticsData {
  total_customers: number;
  new_customers_30d: number;
  new_customers_prev: number;
  active_cards: number;
  total_stamps: number;
  stamps_last_30d: number;
  stamps_prev_30d: number;
  total_redemptions: number;
  redemptions_30d: number;
  coupons_issued: number;
  coupons_redeemed: number;
  stamps_by_day: number[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function KpiCard({
  label, value, subValue, delta, up, icon: Icon, loading,
}: {
  label: string; value: string | number; subValue?: string;
  delta?: string; up?: boolean; icon: React.ElementType; loading?: boolean;
}) {
  return (
    <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: '#8A8D94' }}>{label}</div>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F0F1F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color="#5C5F66" />
        </div>
      </div>
      {loading ? (
        <div style={{ height: 34, background: '#F0F1F4', borderRadius: 6 }} />
      ) : (
        <>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em' }}>{value}</div>
          {subValue && <div style={{ fontSize: 11, color: '#8A8D94', marginTop: 2 }}>{subValue}</div>}
          {delta !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              {up !== undefined && (up
                ? <TrendingUp size={11} color="#0D6B45" />
                : <TrendingDown size={11} color="#8A8D94" />)}
              <span style={{ fontSize: 11, color: up ? '#0D6B45' : '#8A8D94' }}>{delta}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DayBarChart({ data, loading }: { data: number[]; loading: boolean }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
      {DAYS.map((d, i) => (
        <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
            {loading ? (
              <div style={{ width: '100%', height: '50%', background: '#F0F1F4', borderRadius: '4px 4px 0 0' }} />
            ) : (
              <div style={{
                width: '100%',
                height: data[i] > 0 ? `${(data[i] / max) * 100}%` : '3px',
                background: data[i] > 0 ? '#1D9E75' : '#EBEBEB',
                borderRadius: '4px 4px 0 0',
                transition: 'height 600ms cubic-bezier(0.2,0.8,0.2,1)',
              }} />
            )}
          </div>
          <div style={{ fontSize: 10, color: '#8A8D94' }}>{d}</div>
        </div>
      ))}
    </div>
  );
}

function FunnelRow({ label, value, pct }: { label: string; value: number; pct: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: '#8A8D94', fontFamily: 'var(--font-mono)' }}>{value} ({pct}%)</span>
      </div>
      <div style={{ height: 10, background: '#F0F0F2', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#1D9E75', transition: 'width 600ms' }} />
      </div>
    </div>
  );
}

function NoPermission() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 999, background: '#F0F1F4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Lock size={28} color="#8A8D94" />
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Analytics access required</div>
      <div style={{ fontSize: 14, color: '#5C5F66', marginTop: 10, lineHeight: 1.6, maxWidth: 380 }}>
        You do not have permission to view analytics. Ask your Nook admin to grant analytics access in Settings.
      </div>
    </div>
  );
}

function BusinessSelector({ businesses, selectedId, onChange, loading }: {
  businesses: ApiBusiness[]; selectedId: string; onChange: (id: string) => void; loading: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ fontSize: 12, color: '#8A8D94', whiteSpace: 'nowrap' }}>Viewing:</div>
      <div style={{ position: 'relative', flex: 1, maxWidth: 260 }}>
        <select
          value={selectedId}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          style={{
            width: '100%', height: 34, paddingLeft: 10, paddingRight: 28,
            border: '1px solid #EBEBEB', borderRadius: 8,
            background: 'white', color: '#1A1A1F',
            fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
            cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
          }}
        >
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <ChevronDown size={13} color="#8A8D94" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { isMobile } = useBreakpoint();
  const decoded = useMemo(() => decodeToken(), []);
  const isSuperadmin = decoded?.is_superadmin ?? false;
  const hasPermission = isSuperadmin || canView(decoded, 'analytics');

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<ApiBusiness[]>([]);
  const [selectedBizId, setSelectedBizId] = useState<string>('');
  const [bizLoading, setBizLoading] = useState(false);

  useEffect(() => {
    if (!isSuperadmin) return;
    setBizLoading(true);
    api.listBusinesses()
      .then((list) => {
        const filtered = list.filter((b) => !b.is_superadmin || list.length === 1);
        setBusinesses(filtered);
        if (filtered.length > 0) {
          const first = filtered.find((b) => !b.is_superadmin) ?? filtered[0];
          setSelectedBizId(first.id);
        }
      })
      .catch(() => setBusinesses([]))
      .finally(() => setBizLoading(false));
  }, [isSuperadmin]);

  const fetchData = (bizId?: string) => {
    if (!hasPermission) return;
    setLoading(true);
    setError(null);
    api.analytics(isSuperadmin ? bizId : undefined)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isSuperadmin && hasPermission) fetchData();
  }, [isSuperadmin, hasPermission]); // eslint-disable-line

  useEffect(() => {
    if (isSuperadmin && selectedBizId) fetchData(selectedBizId);
  }, [isSuperadmin, selectedBizId]); // eslint-disable-line

  if (!hasPermission) return <NoPermission />;

  function makeDelta(current: number, prev: number) {
    if (prev === 0) return { label: current > 0 ? `+${current} new` : 'no prev data', up: current > 0 };
    const diff = current - prev;
    const pct = Math.round(Math.abs(diff / prev) * 100);
    return { label: `${diff >= 0 ? '+' : ''}${diff} vs prev 30d (${pct}%)`, up: diff >= 0 };
  }

  const stampDelta    = data ? makeDelta(data.stamps_last_30d, data.stamps_prev_30d) : undefined;
  const custDelta     = data ? makeDelta(data.new_customers_30d, data.new_customers_prev) : undefined;
  const redeemRate    = data && data.stamps_last_30d > 0 ? Math.round((data.redemptions_30d / data.stamps_last_30d) * 100) : 0;
  const couponRate    = data && data.coupons_issued > 0 ? Math.round((data.coupons_redeemed / data.coupons_issued) * 100) : 0;
  const selectedBiz   = businesses.find((b) => b.id === selectedBizId);

  return (
    <div style={{ padding: isMobile ? '16px' : '24px 28px', display: 'grid', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 600, letterSpacing: '-0.02em' }}>
            Analytics
            {isSuperadmin && selectedBiz && (
              <span style={{ fontSize: 13, fontWeight: 400, color: '#8A8D94', marginLeft: 8 }}>
                {selectedBiz.name}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#8A8D94', marginTop: 2 }}>Last 30 days real-time data</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {isSuperadmin && !bizLoading && businesses.length > 0 && (
            <BusinessSelector businesses={businesses} selectedId={selectedBizId} onChange={setSelectedBizId} loading={loading} />
          )}
          <button
            onClick={() => fetchData(isSuperadmin ? selectedBizId : undefined)}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 34, padding: '0 12px', border: '1px solid #EBEBEB',
              borderRadius: 8, background: 'white', cursor: 'pointer',
              fontSize: 12, color: '#5C5F66', fontFamily: 'inherit',
            }}
          >
            <RefreshCw size={13} />
            {!isMobile && ' Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FFF0F0', border: '1px solid #FECDCD', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C0392B' }}>
          Failed to load: {error}
        </div>
      )}

      {/* KPI cards — 2 col on mobile, 4 col on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: isMobile ? 10 : 16 }}>
        <KpiCard label="Total customers" value={data?.total_customers ?? '—'} subValue={data ? `+${data.new_customers_30d} this month` : undefined} delta={custDelta?.label} up={custDelta?.up} icon={Users} loading={loading} />
        <KpiCard label="Stamps (30d)" value={data?.stamps_last_30d ?? '—'} subValue={data ? `${data.total_stamps.toLocaleString()} all-time` : undefined} delta={stampDelta?.label} up={stampDelta?.up} icon={Gift} loading={loading} />
        <KpiCard label="Redemptions (30d)" value={data?.redemptions_30d ?? '—'} subValue={data ? `${redeemRate}% redeem rate` : undefined} delta={data ? `${data.total_redemptions} all-time` : undefined} icon={Gift} loading={loading} />
        <KpiCard label="Coupon usage" value={data ? `${couponRate}%` : '—'} subValue={data ? `${data.coupons_redeemed}/${data.coupons_issued} issued` : undefined} delta={data?.coupons_issued === 0 ? 'No coupons yet' : undefined} icon={Ticket} loading={loading} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: 16 }}>

        {/* Stamps by day */}
        <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F2' }}>
            <div className="section-title">Visit activity</div>
            <div style={{ fontSize: 12, color: '#8A8D94' }}>Stamps by day of week, last 30 days</div>
          </div>
          <div style={{ padding: '20px 20px 16px' }}>
            <DayBarChart data={data?.stamps_by_day ?? [0, 0, 0, 0, 0, 0, 0]} loading={loading} />
          </div>
          {data && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid #F0F0F2' }}>
              {[
                { label: 'Total stamps', value: data.total_stamps.toLocaleString() },
                { label: 'Active cards', value: data.active_cards },
                { label: 'Avg/card (30d)', value: data.active_cards > 0 ? (data.stamps_last_30d / data.active_cards).toFixed(1) : '—' },
              ].map((s) => (
                <div key={s.label} style={{ padding: '12px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#8A8D94', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Funnel */}
        <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F2' }}>
            <div className="section-title">Loyalty funnel</div>
            <div style={{ fontSize: 12, color: '#8A8D94' }}>Customer journey</div>
          </div>
          <div style={{ padding: 18, display: 'grid', gap: 14 }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ height: 30, background: '#F0F1F4', borderRadius: 6 }} />
              ))
            ) : data ? (
              <>
                <FunnelRow label="Total customers" value={data.total_customers} pct={100} />
                <FunnelRow label="New this month" value={data.new_customers_30d} pct={data.total_customers > 0 ? Math.round((data.new_customers_30d / data.total_customers) * 100) : 0} />
                <FunnelRow label="Stamped (30d)" value={data.stamps_last_30d} pct={data.total_customers > 0 ? Math.min(100, Math.round((data.stamps_last_30d / data.total_customers) * 50)) : 0} />
                <FunnelRow label="Rewards redeemed" value={data.total_redemptions} pct={data.total_customers > 0 ? Math.round((data.total_redemptions / data.total_customers) * 100) : 0} />
              </>
            ) : (
              <div style={{ fontSize: 13, color: '#8A8D94', textAlign: 'center', padding: '24px 0' }}>No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Coupon summary */}
      {data && data.coupons_issued > 0 && (
        <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F2' }}>
            <div className="section-title">Coupon performance</div>
            <div style={{ fontSize: 12, color: '#8A8D94' }}>All-time</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, padding: '16px 20px', gap: 16 }}>
            {[
              { label: 'Issued', value: data.coupons_issued },
              { label: 'Redeemed', value: data.coupons_redeemed },
              { label: 'Pending', value: data.coupons_issued - data.coupons_redeemed },
              { label: 'Redemption rate', value: `${couponRate}%` },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#8A8D94', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
