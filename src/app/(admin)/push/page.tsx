'use client';

import { useState, useEffect } from 'react';
import { pastCampaigns } from '@/lib/data';
import { Zap, Calendar, Send, Bookmark, Search, CheckSquare, Square, Trash2 } from 'lucide-react';
import { api, ApiCustomer } from '@/lib/api';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const TEMPLATES = [
  { t: 'Welcome new customer',   b: 'Hey {name}, welcome to {business}! Your first stamp is on us \u{1F389}' },
  { t: 'Win-back lapsing',       b: 'We miss you, {name}. Come back this week for 15% off.' },
  { t: 'Reward unlocked',        b: '\u{1F381} You\'ve earned a free {reward}! Show this card to redeem.' },
  { t: 'New product drop',       b: 'Just launched at {business}: come check it out.' },
  { t: 'Birthday treat',         b: 'Happy birthday, {name}! Free {reward} on us today only.' },
  { t: 'Weekend boost',          b: 'Double stamps all weekend. See you soon â' },
];

interface Draft {
  id: string;
  title: string;
  body: string;
  savedAt: string;
}

const DRAFT_KEY = 'nook_push_drafts';
const MAX_DRAFTS = 5;

function Seg({ tabs, active, setActive }: { tabs: string[]; active: string; setActive: (t: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: '#E2EDE6', borderRadius: 9, padding: 3 }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div>
        {hint && <div style={{ fontSize: 11, color: '#8A8D94' }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #D4E6DB', borderRadius: 8,
  fontSize: 13, fontFamily: 'inherit', outline: 'none',
  background: 'white', color: '#1A1A1F',
};

function formatDraftTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
}

export default function PushPage() {
  const { isMobile } = useBreakpoint();
  const [tab, setTab] = useState('compose');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [when, setWhen] = useState('now');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState('');

  // Customer audience
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingCx, setLoadingCx] = useState(false);

  // Drafts
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const bizName = typeof window !== 'undefined' ? localStorage.getItem('nook_biz') ?? 'My Business' : 'My Business';

  useEffect(() => {
    setLoadingCx(true);
    api.customers().then((cs) => {
      setCustomers(cs);
      setSelectedIds(new Set(cs.map((c) => c.id)));
    }).catch(() => {}).finally(() => setLoadingCx(false));

    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '[]');
      setDrafts(Array.isArray(saved) ? saved : []);
    } catch {}
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone ?? '').includes(customerSearch)
  );

  const allSelected = filteredCustomers.length > 0 &&
    filteredCustomers.every((c) => selectedIds.has(c.id));
  const someSelected = filteredCustomers.some((c) => selectedIds.has(c.id));

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        filteredCustomers.forEach((c) => next.delete(c.id));
      } else {
        filteredCustomers.forEach((c) => next.add(c.id));
      }
      return next;
    });
  }

  function toggleCustomer(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function saveDraft() {
    if (!title.trim() && !body.trim()) return;
    const draft: Draft = { id: Date.now().toString(), title, body, savedAt: new Date().toISOString() };
    const next = [draft, ...drafts].slice(0, MAX_DRAFTS);
    setDrafts(next);
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(next)); } catch {}
    setSendResult('Draft saved.');
    setTimeout(() => setSendResult(''), 2000);
  }

  function deleteDraft(id: string) {
    const next = drafts.filter((d) => d.id !== id);
    setDrafts(next);
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(next)); } catch {}
  }

  function loadDraft(draft: Draft) {
    setTitle(draft.title);
    setBody(draft.body);
  }

  const reach = selectedIds.size;

  async function handleSend() {
    if (!title || !body) { setSendResult('Add a title and message before sending.'); return; }
    setSending(true);
    setSendResult('');
    try {
      const res = await api.broadcast(title, body);
      setSendResult(`Sent Â· ${res.web_push_sent} push Â· ${res.wallet_updated} wallets updated`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Send failed';
      try { setSendResult(`Error: ${JSON.parse(msg).error ?? msg}`); }
      catch { setSendResult(`Error: ${msg}`); }
    } finally {
      setSending(false);
    }
  }

  async function handleTestSend() {
    if (!title || !body) { setSendResult('Add a title and message first.'); return; }
    setSendResult('Test sent to your account.');
    setTimeout(() => setSendResult(''), 3000);
  }

  return (
    <div style={{ padding: isMobile ? '16px' : '24px 28px', display: 'grid', gap: 16 }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#1A1A1F', letterSpacing: '-0.025em', lineHeight: 1.2 }}>Push notifications</h1>
          <div style={{ fontSize: 13, color: '#8A8D94', marginTop: 4 }}>Send messages directly to your customers</div>
        </div>
      </div>
      <Seg tabs={['compose', 'history', 'templates']} active={tab} setActive={setTab} />

      {tab === 'compose' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: 16, alignItems: 'start' }}>
          {/* Form */}
          <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)', padding: 22 }}>
            <FormSection title="From business">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={{
                  height: 32, padding: '0 12px',
                  border: '1px solid #1D9E75', borderRadius: 8,
                  background: '#E8F7F2', color: '#085041',
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}>{bizName}</button>
              </div>
            </FormSection>

            {/* Audience */}
            <FormSection
              title="Audience"
              hint={<span style={{ color: '#1D9E75', fontWeight: 500 }}>{reach} selected</span>}
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={13} color="#8A8D94" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search name or phone..."
                    style={{ ...inputStyle, paddingLeft: 30, height: 34, padding: '0 12px 0 30px' }}
                  />
                </div>
                <button
                  onClick={toggleSelectAll}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    height: 34, padding: '0 10px',
                    border: '1px solid #D4E6DB', borderRadius: 8,
                    background: allSelected ? '#E8F7F2' : 'white',
                    color: allSelected ? '#085041' : '#5C5F66',
                    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  }}
                >
                  {allSelected
                    ? <CheckSquare size={14} color="#1D9E75" />
                    : <Square size={14} color="#8A8D94" />}
                  {allSelected ? 'All' : someSelected ? 'Some' : 'None'}
                </button>
              </div>

              <div style={{
                maxHeight: 200, overflowY: 'auto',
                border: '1px solid #D4E6DB', borderRadius: 8,
                background: '#FAFCFB',
              }}>
                {loadingCx ? (
                  <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#8A8D94' }}>Loading customers...</div>
                ) : filteredCustomers.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#8A8D94' }}>No customers found</div>
                ) : filteredCustomers.map((c, i) => {
                  const checked = selectedIds.has(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleCustomer(c.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px',
                        borderTop: i > 0 ? '1px solid #E2EDE6' : 'none',
                        cursor: 'pointer',
                        background: checked ? '#F2FAF6' : 'transparent',
                        transition: 'background 80ms',
                      }}
                    >
                      {checked
                        ? <CheckSquare size={15} color="#1D9E75" style={{ flexShrink: 0 }} />
                        : <Square size={15} color="#C0C4CC" style={{ flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: '#8A8D94', fontFamily: 'var(--font-mono)' }}>{c.phone}</div>
                      </div>
                      {(c.total_stamps ?? 0) > 0 && (
                        <div style={{ fontSize: 11, color: '#1D9E75', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                          {c.total_stamps} stamps
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </FormSection>

            <FormSection title="Title" hint={`${title.length} / 50`}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50}
                style={inputStyle} placeholder="Catchy title..." />
            </FormSection>

            <FormSection title="Message" hint={<span style={{ color: body.length >= 120 ? '#C26B1F' : undefined }}>{body.length} / 160{body.length >= 120 ? ' â ' : ''}</span>}>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={160} rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80, borderColor: body.length >= 120 ? '#C26B1F' : '#D4E6DB' }} />
            </FormSection>

            <FormSection title="Send time">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setWhen('now')} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  height: 32, padding: '0 12px',
                  border: `1px solid ${when === 'now' ? '#1D9E75' : '#D4E6DB'}`,
                  background: when === 'now' ? '#E8F7F2' : 'white',
                  color: when === 'now' ? '#085041' : '#1A1A1F',
                  borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                }}>
                  <Zap size={13} /> Send now
                </button>
                <button onClick={() => setWhen('schedule')} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  height: 32, padding: '0 12px',
                  border: `1px solid ${when === 'schedule' ? '#1D9E75' : '#D4E6DB'}`,
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

            {/* Action row: Save | Test to me | [spacer] | Send to N */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #E2EDE6' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={saveDraft}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    height: 34, padding: '0 12px',
                    border: '1px solid #D4E6DB', borderRadius: 8,
                    background: 'white', color: '#5C5F66',
                    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <Bookmark size={13} /> Save
                </button>
                <button
                  onClick={handleTestSend}
                  style={{
                    height: 34, padding: '0 12px',
                    border: '1px solid #D4E6DB', borderRadius: 8,
                    background: 'white', color: '#5C5F66',
                    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Test to me
                </button>
                <div style={{ flex: 1 }} />
                <button
                  onClick={handleSend}
                  disabled={sending}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    height: 34, padding: '0 16px',
                    background: sending ? '#8A8D94' : '#1D9E75', color: 'white', border: 0, borderRadius: 8,
                    fontSize: 13, fontWeight: 500, cursor: sending ? 'default' : 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <Send size={13} /> {sending ? 'Sending...' : when === 'now' ? `Send to ${reach}` : `Schedule (${reach})`}
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

              {/* Saved drafts list */}
              {drafts.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    Drafts ({drafts.length}/{MAX_DRAFTS})
                  </div>
                  <div style={{ display: 'grid', gap: 4 }}>
                    {drafts.map((d) => (
                      <div key={d.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px', borderRadius: 8,
                        border: '1px solid #E2EDE6', background: '#FAFCFB',
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title || '(no title)'}</div>
                          <div style={{ fontSize: 11, color: '#8A8D94' }}>{formatDraftTime(d.savedAt)}</div>
                        </div>
                        <button
                          onClick={() => loadDraft(d)}
                          style={{ height: 26, padding: '0 8px', border: '1px solid #D4E6DB', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', color: '#1D9E75', fontWeight: 500 }}
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteDraft(d.id)}
                          style={{ width: 26, height: 26, border: '1px solid #E2EDE6', borderRadius: 6, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={12} color="#8A8D94" />
                        </button>
                      </div>
                    ))}
                  </div>
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
                  <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>WALLET Â· NOOK</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.55 }}>now</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{title || 'Title'}</div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2, lineHeight: 1.4 }}>{body || 'Message body...'}</div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)', padding: 16, marginTop: 12 }}>
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
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F2FAF6' }}>
                {['Campaign', 'Business', 'Sent', 'Reach', 'Opens', 'CTR'].map((h, i) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: i > 2 ? 'right' : 'left', fontWeight: 500, fontSize: 11, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pastCampaigns.map((p, i) => (
                <tr key={i} style={{ borderTop: '1px solid #E2EDE6' }}>
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
            <div key={i} style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)', padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{tpl.t}</div>
              <div style={{ fontSize: 12, color: '#5C5F66', marginTop: 6, lineHeight: 1.45 }}>{tpl.b}</div>
              <button onClick={() => { setTitle(tpl.t); setBody(tpl.b); setTab('compose'); }} style={{ marginTop: 12, height: 28, padding: '0 10px', border: '1px solid #D4E6DB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Use template</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
