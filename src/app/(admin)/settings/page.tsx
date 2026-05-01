'use client';

import { useState } from 'react';
import { businesses } from '@/lib/data';
import { Plus, MoreHorizontal } from 'lucide-react';

function SettingsCard({ title, desc, right, children, danger }: {
  title: string; desc?: string; right?: React.ReactNode; children?: React.ReactNode; danger?: boolean;
}) {
  return (
    <div style={{
      background: 'white', borderRadius: 13,
      border: `1px solid ${danger ? '#F0D5DC' : '#EBEBEB'}`,
      padding: 22,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: desc ? 4 : 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: danger ? '#9C2848' : '#1A1A1F' }}>{title}</div>
        {right}
      </div>
      {desc && <div style={{ fontSize: 12, color: '#5C5F66', marginBottom: 14 }}>{desc}</div>}
      {children}
    </div>
  );
}

function FieldRow({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #F0F0F2' }}>
      <div style={{ fontSize: 12, color: '#8A8D94' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        {swatch && <span style={{ width: 14, height: 14, borderRadius: 4, background: swatch, border: '1px solid rgba(0,0,0,0.06)', display: 'inline-block' }} />}
        <span style={{ fontFamily: 'var(--font-mono)' }}>{value}</span>
        <button style={{ height: 26, padding: '0 8px', border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#8A8D94', fontFamily: 'inherit' }}>Edit</button>
      </div>
    </div>
  );
}

function UsageRow({ label, used, cap }: { label: string; used: number; cap: number | string }) {
  const pct = typeof cap === 'number' ? Math.min(100, (used / cap) * 100) : 30;
  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid #F0F0F2' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
        <span>{label}</span>
        <span style={{ color: '#8A8D94', fontFamily: 'var(--font-mono)' }}>{used} / {cap}</span>
      </div>
      <div style={{ height: 6, background: '#F0F0F2', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#1D9E75', transition: 'width 400ms' }} />
      </div>
    </div>
  );
}

const TABS = ['workspace', 'businesses', 'team', 'billing', 'integrations', 'branding'];

const TEAM = [
  { n: 'Woosang',  e: 'woosang@nook.app',    r: 'Owner',               c: '#1A1A1F' },
  { n: 'Mira Park', e: 'mira@nook.app',      r: 'Admin',               c: '#1D9E75' },
  { n: 'Jay Han',  e: 'jay@kook.kr',          r: 'Manager · Kook 미용실', c: '#3B6BCC' },
  { n: 'Andre Lee', e: 'andre@fortlee.com',  r: 'Staff · Fort Lee Gym', c: '#C26B1F' },
];

const INTEGRATIONS = [
  { n: 'Apple Wallet',  d: 'Issue passes to iOS users',          ok: true },
  { n: 'Google Wallet', d: 'Issue passes to Android users',      ok: true },
  { n: 'Square',        d: 'Sync transactions for cashback',     ok: false },
  { n: 'Stripe',        d: 'Process subscription payments',      ok: true },
  { n: 'Twilio',        d: 'SMS fallback for non-wallet users',  ok: false },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('workspace');

  return (
    <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
      {/* Left nav */}
      <nav style={{ display: 'grid', gap: 2, alignContent: 'start' }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 12px', border: 0, borderRadius: 8,
            background: tab === t ? '#E8F7F2' : 'transparent',
            color: tab === t ? '#085041' : '#5C5F66',
            fontWeight: tab === t ? 500 : 400,
            textAlign: 'left', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </nav>

      {/* Content */}
      <div style={{ display: 'grid', gap: 16 }}>
        {tab === 'workspace' && <>
          <SettingsCard title="Workspace" desc="The container that owns all your businesses.">
            <FieldRow label="Workspace name" value="Nook Loyalty Co." />
            <FieldRow label="Owner" value="Woosang · woosang@nook.app" />
            <FieldRow label="Region" value="us-east-1" />
            <FieldRow label="Timezone" value="America/New_York" />
          </SettingsCard>
          <SettingsCard title="Danger zone" danger>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Delete workspace</div>
                <div style={{ fontSize: 12, color: '#5C5F66' }}>Permanently delete all 4 businesses, 12 cards, and 284 customers.</div>
              </div>
              <button style={{ height: 32, padding: '0 12px', border: '1px solid #E5BCC9', borderRadius: 8, background: 'white', color: '#9C2848', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Delete</button>
            </div>
          </SettingsCard>
        </>}

        {tab === 'businesses' && (
          <SettingsCard title="Businesses" desc="Each business has its own cards, customers, and branding."
            right={
              <button style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', background: '#1D9E75', color: 'white', border: 0, borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={13} /> Add business
              </button>
            }
          >
            {businesses.filter((b) => b.id !== 'all').map((b) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid #F0F0F2' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: b.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{b.short}</div>
                <div style={{ flex: 1, lineHeight: 1.3 }}>
                  <div style={{ fontWeight: 500 }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: '#8A8D94' }}>{b.customers} customers · 3 cards</div>
                </div>
                <button style={{ height: 30, padding: '0 10px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Manage</button>
              </div>
            ))}
          </SettingsCard>
        )}

        {tab === 'team' && (
          <SettingsCard title="Team & roles" desc="Invite teammates and grant access per business."
            right={
              <button style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', background: '#1D9E75', color: 'white', border: 0, borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={13} /> Invite
              </button>
            }
          >
            {TEAM.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i ? '1px solid #F0F0F2' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 999, background: m.c, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
                  {m.n.split(' ').map((w) => w[0]).join('')}
                </div>
                <div style={{ flex: 1, lineHeight: 1.3 }}>
                  <div style={{ fontWeight: 500 }}>{m.n}</div>
                  <div style={{ fontSize: 12, color: '#8A8D94' }}>{m.e}</div>
                </div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#F0F1F4', color: '#5C5F66' }}>{m.r}</span>
                <button style={{ height: 26, width: 26, border: 0, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MoreHorizontal size={16} color="#8A8D94" />
                </button>
              </div>
            ))}
          </SettingsCard>
        )}

        {tab === 'billing' && <>
          <SettingsCard title="Plan" desc="You're on the trial. Upgrade to keep going."
            right={
              <button style={{ height: 32, padding: '0 12px', background: '#1D9E75', color: 'white', border: 0, borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Upgrade to Pro</button>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: '#E8F7F2', borderRadius: 10 }}>
              <div style={{ flex: 1, lineHeight: 1.4 }}>
                <div style={{ fontWeight: 500, color: '#085041' }}>Trial · 14 days left</div>
                <div style={{ fontSize: 12, color: '#085041', opacity: 0.8 }}>Pro is $49/mo per business · unlimited cards, Apple Wallet, custom branding.</div>
              </div>
            </div>
          </SettingsCard>
          <SettingsCard title="Usage this month">
            <UsageRow label="Active customers" used={284} cap={500} />
            <UsageRow label="Push notifications sent" used={612} cap={2000} />
            <UsageRow label="Wallet pushes" used={284} cap={'∞'} />
          </SettingsCard>
        </>}

        {tab === 'integrations' && (
          <SettingsCard title="Integrations">
            {INTEGRATIONS.map((it, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: i ? '1px solid #F0F0F2' : 'none' }}>
                <div style={{ lineHeight: 1.3 }}>
                  <div style={{ fontWeight: 500 }}>{it.n}</div>
                  <div style={{ fontSize: 12, color: '#8A8D94' }}>{it.d}</div>
                </div>
                {it.ok
                  ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#E8F7F2', color: '#085041', fontWeight: 500 }}>● Connected</span>
                  : <button style={{ height: 30, padding: '0 10px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Connect</button>
                }
              </div>
            ))}
          </SettingsCard>
        )}

        {tab === 'branding' && (
          <SettingsCard title="Default branding" desc="Used as fallback when a business hasn't set its own.">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 84, height: 84, borderRadius: 14, background: '#1D9E75', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 38 }}>n</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ height: 32, padding: '0 12px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Upload logo</button>
                  <button style={{ height: 32, padding: '0 12px', border: 0, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#5C5F66', fontFamily: 'inherit' }}>Remove</button>
                </div>
                <div style={{ fontSize: 12, color: '#8A8D94', marginTop: 8 }}>Recommended 512×512px PNG with transparent background.</div>
              </div>
            </div>
            <FieldRow label="Brand color" value="#1D9E75" swatch="#1D9E75" />
            <FieldRow label="Wallet card style" value="Gradient · dark" />
          </SettingsCard>
        )}
      </div>
    </div>
  );
}
