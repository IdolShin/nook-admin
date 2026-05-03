'use client';

import { useState, useEffect } from 'react';
import { pastCampaigns } from '@/lib/data';
import { Zap, Calendar, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const AUDIENCES = [
  { id: 'all',     label: 'All customers',      count: null },
  { id: 'vip',     label: 'VIPs only',          count: null },
  { id: 'lapsing', label: 'Lapsing (14+ days)', count: null },
  { id: 'new',     label: 'New this month',      count: null },
];

const TEMPLATES = [
  { t: 'Welcome new customer',   b: 'Hey {name}, welcome to {business}! Your first stamp is on us 🎉' },
  { t: 'Win-back lapsing',       b: 'We miss you, {name}. Come back this week for 15% off.' },
  { t: 'Reward unlocked',        b: '🎁 You\'ve earned a free {reward}! Show this card to redeem.' },
  { t: 'New product drop',       b: 'Just launched at {business}: come check it out.' },
  { t: 'Birthday treat',         b: 'Happy birthday, {name}! Free {reward} on us today only.' },
  { t: 'Weekend boost',          b: 'Double stamps all weekend. See you soon ☕' },
];

function Seg({ tabs, active, setActive }: { tabs: string[]; active: string; setActive: (t: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: '#F0F1F4', borderRadius: 9, padding: 3 }}>
      {tabs.map((t) => (
        <button key={t} onClick={() => setActive(t)} style={{
          height: 26, padding: '0 12px', border: 0, borderRadius: 7,
          background: active === t ? 'white' : 'transparent',
          color: active === t ? '#1A1A1F' : '#5C5F66',
          fontSize: 12, fontWeight: active === t ? 500 : 400,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: active === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          textTransform: 'capitalize',
        }}>{t}</button>
      ))}
    </div>
  );
}

function FormSection({ title, hint, children }: { title: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div>
        {hint && <div style={{ fontSize: 11, color: '#8A8D94' }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #EBEBEB', borderRadius: 8,
  fontSize: 13, fontFamily: 'inherit', outline: 'none',
  background: 'white', color: '#1A1A1F',
};

export default function PushPage() {
  const { isMobile } = useBreakpoint();
  const [tab, setTab] = useState('compose');
  const [audience, setAudience] = useState('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [when, setWhen] = useState('now');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState('');
  const [realCount, setRealCount] = useState<number | null>(null);
  const bizName = typeof window !== 'undefined' ? localStorage.getItem('nook_biz') ?? 'My Business' : 'My Business';

  useEffect(() => {
    api.customers().then((cs) => setRealCount(cs.length)).catch(() => {});
  }, []);

  const reach = realCount ?? 0;

  async function handleSend() {
    if (!title || !body) { setSendResult('Add a title and message before sending.'); return; }
    setSending(true);
    setSendResult('');
    try {
      const res = await api.broadcast(title, body);
      setSendResult(`Sent · ${res.web_push_sent} push · ${res.wallet_updated} wallets updated`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Send failed';
      try { setSendResult(`Error: ${JSON.parse(msg).error ?? msg}`); }
      catch { setSendResult(`Error: ${msg}`); }
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ padding: isMobile ? '16px' : '24px 28px', display: 'grid', gap: 16 }}>
      <Seg tabs={['compose', 'history', 'templates']} active={tab} setActive={setTab} />

      {tab === 'compose' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: 16, alignItems: 'start' }}>
          {/* Form */}
          <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 22 }}>
            <FormSection title="From business">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[bizName].map((b) => (
                  <button key={b} style={{
                    height: 32, padding: '0 12px',
                    border: `1px solid #1D9E75`,
                    borderRadius: 8,
                    background: '#E8F7F2',
                    color: '#085041',
                    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{b}</button>
                ))}
              </div>
            </FormSection>

            <FormSection title="Audience" hint={`${reach} customers will receive this`}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                {AUDIENCES.map((a) => (
                  <button key={a.id} onClick={() => setAudience(a.id)} style={{
                    border: `1px solid ${audience === a.id ? '#1D9E75' : '#EBEBEB'}`,
                    background: audience === a.id ? '#E8F7F2' : 'white',
                    borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'inherit',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: audience === a.id ? '#085041' : '#1A1A1F' }}>{a.label}</span>
                    <span style={{ fontSize: 12, color: '#8A8D94', fontFamily: 'var(--font-mono)' }}>{a.id === 'all' ? (realCount ?? '…') : '—'}</span>
                  </button>
                ))}
              </div>
            </FormSection>

            <FormSection title="Title" hint={`${title.length} / 50`}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50}
                style={inputStyle} placeholder="Catchy title…" />
            </FormSection>

            <FormSection title="Message" hint={<span style={{ color: body.length >= 120 ? '#C26B1F' : undefined }}>{body.length} / 160{body.length >= 120 ? ' ⚠' : ''}</span>}>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={160} rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80, borderColor: body.length >= 120 ? '#C26B1F' : undefined }} />
            </FormSection>

            <FormSection title="Send">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setWhen('now')} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  height: 32, padding: '0 12px',
                  border: `1px solid ${when === 'now' ? '#1D9E75' : '#EBEBEB'}`,
                  background: when === 'now' ? '#E8F7F2' : 'white',
                  color: when === 'now' ? '#085041' : '#1A1A1F',
                  borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                }}>
                  <Zap size={13} /> Send now
                </button>
                <button onClick={() => setWhen('schedule')} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  height: 32, padding: '0 12px',
                  border: `1px solid ${when === 'schedule' ? '#1D9E75' : '#EBEBEB'}`,
                  background: when === 'schedule' ? '#E8F7F2' : 'white',
                  color: when === 'schedule' ? '#085041' : '#1A1A1F',
                  borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                }}>
                  <Calendar size={13} /> Schedule
                </button>
                {when === 'schedule' && (
                  <input type="datetime-local" defaultValue="2026-05-02T11:00" style={{ ...inputStyle, width: 'auto', height: 32, padding: '0 10px' }} />
                )}
              </div>
            </FormSection>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #F0F0F2' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button style={{ height: 32, padding: '0 12px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Save as draft</button>
                <div style={{ flex: 1 }} />
                <button style={{ height: 32, padding: '0 12px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Send test to me</button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    height: 34, padding: '0 16px',
                    background: sending ? '#8A8D94' : '#1D9E75', color: 'white', border: 0, borderRadius: 8,
                    fontSize: 13, fontWeight: 500, cursor: sending ? 'default' : 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <Send size={13} /> {sending ? 'Sending…' : when === 'now' ? `Send to ${reach}` : `Schedule (${reach})`}
                </button>
              </div>
              {sendResult && (
                <div style={{
                  fontSize: 12, marginTop: 10, padding: '8px 12px', borderRadius: 8,
                  background: sendResult.startsWith('Error') ? '#FBE2EC' : '#E8F7F2',
                  color: sendResult.startsWith('Error') ? '#9C2848' : '#0D6B45',
                }}>
                  {sendResult}
                </div>
              )}
            </div>
          </div>

          {/* Live preview */}
          <div style={{ position: 'sticky', top: 84 }}>
            <div style={{ fontSize: 11, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Live preview</div>
            <div style={{
              background: 'linear-gradient(180deg, #1A1A1F 0%, #2A2A30 100%)',
              borderRadius: 13, border: '1px solid transparent', padding: 18,
            }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textAlign: 'center' }}>iPhone lock screen</div>
              <div style={{ background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 12, color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>n</div>
                  <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>WALLET · NOOK</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.55 }}>now</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{title || 'Title'}</div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2, lineHeight: 1.4 }}>{body || 'Message body…'}</div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 16, marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Estimated impact</div>
              {[['Reach', reach.toString()], ['Estimated opens', Math.round(reach * 0.62).toString()], ['Visits driven (avg)', Math.round(reach * 0.18).toString()]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                  <span style={{ color: '#8A8D94' }}>{l}</span>
                  <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#FAFAFB' }}>
                {['Campaign', 'Business', 'Sent', 'Reach', 'Opens', 'CTR'].map((h, i) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: i > 2 ? 'right' : 'left', fontWeight: 500, fontSize: 11, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pastCampaigns.map((p, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F0F0F2' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{p.title}</td>
                  <td style={{ padding: '12px 16px', color: '#5C5F66' }}>{p.biz}</td>
                  <td style={{ padding: '12px 16px', color: '#8A8D94' }}>{p.sent}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{p.reach}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{p.opens}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#0D6B45', fontWeight: 500 }}>{p.ctr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 12 }}>
          {TEMPLATES.map((tpl, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{tpl.t}</div>
              <div style={{ fontSize: 12, color: '#5C5F66', marginTop: 6, lineHeight: 1.45 }}>{tpl.b}</div>
              <button onClick={() => { setTitle(tpl.t); setBody(tpl.b); setTab('compose'); }} style={{ marginTop: 12, height: 28, padding: '0 10px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Use template</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
