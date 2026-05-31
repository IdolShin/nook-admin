'use client';

import { useState, useEffect } from 'react';
import { pastCampaigns } from '@/lib/data';
import { Zap, Calendar, Send, Bookmark, Search, CheckSquare, Square, Trash2, Plus, Clock, FileText, Lock } from 'lucide-react';
import { api, ApiCustomer } from '@/lib/api';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { usePlan } from '@/hooks/usePlan';

const TEMPLATES = [
  {
    emoji: '☕',
    t:    '오늘 더블 스탬프!',
    b:    '오늘 하루만! 모든 방문 고객님께 스탬프 2배 제공합니다. 오늘 꼭 나오세요!',
    t_en: 'Double Stamps Today!',
    b_en: 'Today only! Every customer gets double stamps on every visit. Come in and make it count!',
    audience: 'all',
  },
  {
    emoji: '🎁',
    t:    '리워드 달성했어요!',
    b:    '축하합니다! 스탬프를 모두 모으셨습니다. 매장 방문 시 카드를 보여주세요 — 리워드를 받으실 수 있습니다!',
    t_en: 'You\'ve Earned a Reward!',
    b_en: 'Congratulations! You\'ve collected all your stamps. Show your card on your next visit to claim your reward!',
    audience: 'active',
  },
  {
    emoji: '👋',
    t:    '오래만이에요~',
    b:    '바쁘셨나요? 다시 방문해 주시면 다음 방문시 보너스 스탬프를 드립니다! 기다리고 있습니다 :)',
    t_en: 'We Miss You!',
    b_en: 'It\'s been a while! Come back and we\'ll give you a bonus stamp on your next visit. We\'d love to see you :)',
    audience: 'inactive',
  },
  {
    emoji: '🎉',
    t:    '신규 가입 환영합니다!',
    b:    '우리 매장에 첫 방문하셨군요! 첫 방문 고객님께 첫 스탬프 무료 제공합니다. 꼭 오세요!',
    t_en: 'Welcome to the Family!',
    b_en: 'Thanks for joining us! As a welcome gift, your first stamp is on us. We hope to see you again soon!',
    audience: 'new',
  },
  {
    emoji: '📢',
    t:    '새 메뉴 출시!',
    b:    '기다리던 신메뉴가 드디어 나왔습니다! 직접 방문해서 첫 번째로 맛봐보세요.',
    t_en: 'New Menu Just Dropped!',
    b_en: 'Our new menu is finally here! Come in and be one of the first to try it.',
    audience: 'all',
  },
];

interface Draft {
  id: string;
  title: string;
  body: string;
  savedAt: string;
}

const DRAFT_KEY = 'nook_push_drafts';
const MAX_DRAFTS = 5;


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
  const { canFilterAudience, pushLimitDays, isSuperadmin, isBasic, isPro, isPremium } = usePlan();
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

  // Template language
  const [templateLang, setTemplateLang] = useState<'ko' | 'en'>('ko');

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

  // Audience group helpers
  const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  const AUDIENCE_GROUPS = [
    { id: 'all',      label: 'All',      color: '#1D9E75', filterFn: (_c: ApiCustomer) => true },
    { id: 'new',      label: 'New',      color: '#3B82F6', filterFn: (c: ApiCustomer)  => daysSince(c.created_at) < 30 },
    { id: 'active',   label: 'Active',   color: '#085041', filterFn: (c: ApiCustomer)  => (c.total_stamps ?? 0) > 0 },
    { id: 'inactive', label: 'Inactive', color: '#E05050', filterFn: (c: ApiCustomer)  => (c.total_stamps ?? 0) === 0 },
  ];

  function selectGroup(filterId: string) {
    const group = AUDIENCE_GROUPS.find(g => g.id === filterId);
    if (!group) return;
    const matching = customers.filter(group.filterFn);
    setSelectedIds(new Set(matching.map(c => c.id)));
  }

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
      if (res.scheduled) {
        setSendResult(`예약됨 ${String.fromCharCode(183)} ${res.scheduled_for_et ?? res.scheduled_for} (동부시간 오전 8시~오후 8시 외)`);
      } else {
        setSendResult(`Sent ${String.fromCharCode(183)} ${res.web_push_sent ?? 0} push ${String.fromCharCode(183)} ${res.wallet_updated ?? 0} wallets updated`);
      }
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#1A1A1F', letterSpacing: '-0.025em', lineHeight: 1.2 }}>Push notifications</h1>
          <div style={{ fontSize: 13, color: '#8A8D94', marginTop: 4 }}>Send messages directly to your customers</div>
        </div>
        <button onClick={() => { setTitle(''); setBody(''); setSendResult(''); setTab('compose'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', background: '#1D9E75', color: 'white', border: 0, borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <Plus size={16} /> New Push
        </button>
      </div>

      {/* Full-width 3-tab buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {([['compose', 'Compose', Send], ['history', 'History', Clock], ['templates', 'Templates', FileText]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            height: 46, border: 0, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            background: tab === id ? '#1D9E75' : 'white',
            color: tab === id ? 'white' : '#5C5F66',
            fontSize: isMobile ? 13 : 14, fontWeight: tab === id ? 600 : 400,
            boxShadow: tab === id
              ? '0 2px 8px rgba(29,158,117,0.3)'
              : '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
            transition: 'all 150ms',
          }}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

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
              {/* Plan banner */}
              {!isSuperadmin && isPremium && (
                <div style={{ marginBottom: 10, padding: '10px 14px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1px solid #93C5FD', borderRadius: 10, fontSize: 12, color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 15 }}>✨</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>Premium — Unlimited Push</div>
                      <div style={{ fontSize: 11, opacity: 0.85, marginTop: 1 }}>No frequency limit · Target any audience segment</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, background: '#2563EB', color: 'white', padding: '2px 8px', borderRadius: 20 }}>PREMIUM</span>
                </div>
              )}
              {!isSuperadmin && isBasic && (
                <div style={{ marginBottom: 10, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Lock size={13} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>Basic Plan</div>
                      <div style={{ fontSize: 11, opacity: 0.85, marginTop: 1 }}>1 push/month · Sends to all customers only</div>
                    </div>
                  </div>
                  <button onClick={() => window.location.href = '/upgrade'} style={{ fontSize: 11, fontWeight: 700, background: '#F59E0B', color: 'white', border: 0, padding: '4px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Upgrade</button>
                </div>
              )}
              {!isSuperadmin && isPro && (
                <div style={{ marginBottom: 10, padding: '10px 14px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, fontSize: 12, color: '#14532D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Lock size={13} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>Pro Plan</div>
                      <div style={{ fontSize: 11, opacity: 0.85, marginTop: 1 }}>1 push/week · Sends to all customers only · Upgrade for audience targeting</div>
                    </div>
                  </div>
                  <button onClick={() => window.location.href = '/upgrade'} style={{ fontSize: 11, fontWeight: 700, background: '#16A34A', color: 'white', border: 0, padding: '4px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Upgrade</button>
                </div>
              )}

              {/* Group quick-select buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                {AUDIENCE_GROUPS.map((g) => {
                  const count = customers.filter(g.filterFn).length;
                  const isLocked = !isSuperadmin && !canFilterAudience && g.id !== 'all';
                  return (
                    <button
                      key={g.id}
                      onClick={() => !isLocked && selectGroup(g.id)}
                      style={{
                        height: 34, border: 0, borderRadius: 8,
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                        background: isLocked ? '#E0E0E0' : g.color,
                        color: isLocked ? '#999' : 'white',
                        fontSize: 12, fontWeight: 500, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 1,
                        transition: 'opacity 120ms',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => { if (!isLocked) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                    >
                      {isLocked
                        ? <><Lock size={11} /><span style={{ fontSize: 10 }}>{g.label}</span></>
                        : <><span>{g.label}</span><span style={{ fontSize: 10, opacity: 0.8 }}>{count}</span></>
                      }
                    </button>
                  );
                })}
              </div>

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

            <FormSection title="Message" hint={`${body.length} / 160`}>
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
                  <input type="datetime-local" style={{ ...inputStyle, width: 'auto', height: 32, padding: '0 10px' }} />
                )}
              </div>
            </FormSection>

            {/* Action row */}
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
                  <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>WALLET {String.fromCharCode(183)} NOOK</span>
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
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#1D9E75' }}>{p.ctr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'templates' && (
        <div>
          {/* Language toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#8A8D94', marginRight: 2 }}>Language</span>
            <button
              onClick={() => setTemplateLang('ko')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                height: 32, padding: '0 12px',
                border: `1.5px solid ${templateLang === 'ko' ? '#1D9E75' : '#D4E6DB'}`,
                borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                background: templateLang === 'ko' ? '#E8F7F2' : 'white',
                color: templateLang === 'ko' ? '#085041' : '#5C5F66',
                fontSize: 13, fontWeight: templateLang === 'ko' ? 600 : 400,
                transition: 'all 120ms',
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>🇰🇷</span> KOR
            </button>
            <button
              onClick={() => setTemplateLang('en')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                height: 32, padding: '0 12px',
                border: `1.5px solid ${templateLang === 'en' ? '#1D9E75' : '#D4E6DB'}`,
                borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                background: templateLang === 'en' ? '#E8F7F2' : 'white',
                color: templateLang === 'en' ? '#085041' : '#5C5F66',
                fontSize: 13, fontWeight: templateLang === 'en' ? 600 : 400,
                transition: 'all 120ms',
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>🇺🇸</span> ENG
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
            {TEMPLATES.map((tpl, i) => {
              const tplTitle = templateLang === 'ko' ? tpl.t : tpl.t_en;
              const tplBody  = templateLang === 'ko' ? tpl.b : tpl.b_en;
              return (
                <div key={i} style={{
                  background: 'white', borderRadius: 16,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
                  padding: 18,
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: '#E8F7F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20,
                    }}>{tpl.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1F', marginBottom: 4 }}>{tplTitle}</div>
                      <div style={{ fontSize: 12, color: '#5C5F66', lineHeight: 1.5 }}>{tplBody}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 6,
                      background: tpl.audience === 'all' ? '#E8F7F2' :
                        tpl.audience === 'active' ? '#E8F0FB' :
                        tpl.audience === 'new' ? '#EAF2FF' : '#FBE8E8',
                      color: tpl.audience === 'all' ? '#085041' :
                        tpl.audience === 'active' ? '#3B3BA0' :
                        tpl.audience === 'new' ? '#1A50A0' : '#8B1A1A',
                      fontWeight: 500, textTransform: 'capitalize',
                    }}>
                      {tpl.audience}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        fontSize: 11, color: '#8A8D94',
                        display: 'flex', alignItems: 'center', gap: 3,
                      }}>
                        <span style={{ fontSize: 13 }}>{templateLang === 'ko' ? '🇰🇷' : '🇺🇸'}</span>
                        <span>{templateLang === 'ko' ? 'KOR' : 'ENG'}</span>
                      </div>
                      <button
                        onClick={() => {
                          setTitle(tplTitle);
                          setBody(tplBody);
                          selectGroup(tpl.audience);
                          setTab('compose');
                        }}
                        style={{
                          height: 30, padding: '0 12px',
                          background: '#1D9E75', color: 'white', border: 0, borderRadius: 8,
                          fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Use template
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
