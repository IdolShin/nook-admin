'use client';

import { useState, useMemo } from 'react';
import { cards as LC_DATA } from '@/lib/data';
import { typeMeta, statusMeta } from '@/lib/utils';
import MiniCardArt from '@/components/cards/MiniCardArt';
import Sparkline from '@/components/charts/Sparkline';
import { Search, Download, Plus, ChevronDown, X, MoreHorizontal, Send } from 'lucide-react';

type Card = typeof LC_DATA[number];

function StatusPill({ status }: { status: string }) {
  const s = statusMeta[status] ?? statusMeta.active;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 500,
      padding: '2px 8px', borderRadius: 999,
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />
      {s.label}
    </span>
  );
}

function TypePill({ type }: { type: string }) {
  const t = typeMeta[type] ?? typeMeta.stamp;
  return (
    <span style={{
      fontSize: 11, fontWeight: 500,
      padding: '2px 8px', borderRadius: 999,
      color: t.text, background: t.bg,
    }}>{t.label}</span>
  );
}

function FilterDropdown({ label, value, options, onChange }: {
  label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.value === value);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        height: 32, padding: '0 10px',
        border: '1px solid #EBEBEB', borderRadius: 8,
        background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
      }}>
        <span style={{ color: '#8A8D94' }}>{label}:</span>
        <span>{cur?.label}</span>
        <ChevronDown size={13} color="#8A8D94" />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 38, left: 0, zIndex: 10,
            minWidth: 180, padding: 6,
            background: 'white', borderRadius: 10,
            border: '1px solid #EBEBEB',
            boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
          }}>
            {options.map((o) => (
              <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  display: 'block', width: '100%', padding: '8px 10px',
                  border: 0, background: value === o.value ? '#E8F7F2' : 'transparent',
                  color: value === o.value ? '#085041' : '#1A1A1F',
                  borderRadius: 6, textAlign: 'left', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { if (value !== o.value) (e.currentTarget as HTMLElement).style.background = '#F5F6FA'; }}
                onMouseLeave={(e) => { if (value !== o.value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CardTile({ card, selected, onSelect }: { card: Card; selected: boolean; onSelect: () => void }) {
  const adoption = card.issued ? Math.round((card.active / card.issued) * 100) : 0;
  return (
    <div
      onClick={onSelect}
      style={{
        background: 'white', borderRadius: 13,
        border: `1px solid ${selected ? '#1D9E75' : '#EBEBEB'}`,
        padding: 14, cursor: 'pointer',
        outline: selected ? '2px solid #1D9E75' : '2px solid transparent',
        outlineOffset: -1,
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 22px rgba(0,0,0,0.06)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 14px' }}>
        <MiniCardArt card={card} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>{card.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8A8D94' }}>
            <span style={{ color: card.bizColor, fontWeight: 500 }}>{card.biz}</span>
            <span>·</span>
            <TypePill type={card.type} />
          </div>
        </div>
        <StatusPill status={card.status} />
      </div>

      <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 12, borderTop: '1px solid #F0F0F2' }}>
        {([['Active', card.active], ['Issued', card.issued], ['Redeems', card.redemptions]] as [string, number][]).map(([l, v]) => (
          <div key={l} style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#8A8D94' }}>{l}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1, fontFamily: 'var(--font-mono)' }}>{v.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8A8D94', marginBottom: 4 }}>
          <span>Adoption</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{adoption}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 999, background: '#F0F0F2', overflow: 'hidden' }}>
          <div style={{ width: `${adoption}%`, height: '100%', background: card.bizColor, transition: 'width 400ms' }} />
        </div>
      </div>
    </div>
  );
}

function CardsTable({ rows, selectedId, onSelect }: { rows: Card[]; selectedId: string | null; onSelect: (c: Card) => void }) {
  const thStyle: React.CSSProperties = { padding: '12px 14px', textAlign: 'left', fontWeight: 500, fontSize: 11, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '0.04em' };
  const tdStyle: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' };
  return (
    <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#FAFAFB' }}>
            <th style={thStyle}>Card</th>
            <th style={thStyle}>Business</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Status</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Active</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Issued</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Redeems</th>
            <th style={thStyle}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} onClick={() => onSelect(c)}
              style={{
                borderTop: '1px solid #F0F0F2',
                background: selectedId === c.id ? '#E8F7F2' : 'transparent',
                cursor: 'pointer', transition: 'background 100ms',
              }}
              onMouseEnter={(e) => { if (selectedId !== c.id) (e.currentTarget as HTMLElement).style.background = '#FAFAFB'; }}
              onMouseLeave={(e) => { if (selectedId !== c.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 36, height: 24, borderRadius: 5, background: `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})`, flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                </div>
              </td>
              <td style={{ ...tdStyle, color: c.bizColor, fontWeight: 500 }}>{c.biz}</td>
              <td style={tdStyle}><TypePill type={c.type} /></td>
              <td style={tdStyle}><StatusPill status={c.status} /></td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{c.active}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{c.issued}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{c.redemptions}</td>
              <td style={{ ...tdStyle, color: '#8A8D94' }}>{c.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardDetail({ card, onClose }: { card: Card; onClose: () => void }) {
  const last7 = [12, 18, 22, 19, 26, 31, 28];
  return (
    <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 0, position: 'sticky', top: 84 }} className="fadeup">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #F0F0F2' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatusPill status={card.status} />
          <TypePill type={card.type} />
        </div>
        <button onClick={onClose} style={{ height: 26, width: 26, border: 0, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
          <X size={14} color="#5C5F66" />
        </button>
      </div>
      <div style={{ padding: 18 }}>
        <div style={{ fontSize: 11, color: '#8A8D94', textTransform: 'uppercase', letterSpacing: '.04em' }}>{card.biz}</div>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', marginTop: 2 }}>{card.name}</div>
        <div style={{ fontSize: 12, color: '#5C5F66', marginTop: 4 }}>{card.reward}</div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 4px' }}>
          <MiniCardArt card={card} w={280} h={172} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 14 }}>
          {([['Active', card.active], ['Issued', card.issued], ['Redeems', card.redemptions]] as [string, number][]).map(([l, v]) => (
            <div key={l} style={{ padding: '10px 12px', border: '1px solid #F0F0F2', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#8A8D94' }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', fontFamily: 'var(--font-mono)' }}>{v.toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 14, background: '#FAFAFB', borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Last 7 days</span>
            <span style={{ fontSize: 11, color: '#8A8D94', fontFamily: 'var(--font-mono)' }}>{last7.reduce((a, b) => a + b, 0)} stamps</span>
          </div>
          <Sparkline values={last7} color={card.bizColor} w={290} h={36} />
        </div>
        <div style={{ fontSize: 12, color: '#8A8D94', marginTop: 14 }}>Updated {card.updated}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button style={{ flex: 1, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#1D9E75', color: 'white', border: 0, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Edit card
          </button>
          <button style={{ height: 34, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 5, border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
            <Send size={13} color="#5C5F66" /> Push
          </button>
          <button style={{ height: 34, padding: '0 8px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <MoreHorizontal size={16} color="#5C5F66" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CardsPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Card | null>(null);

  const filtered = useMemo(() => LC_DATA.filter((c) => {
    if (type !== 'all' && c.type !== type) return false;
    if (status !== 'all' && c.status !== status) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.biz.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [type, status, search]);

  const totals = useMemo(() => ({
    total: filtered.length,
    active: filtered.filter((c) => c.status === 'active').length,
    issued: filtered.reduce((s, c) => s + c.issued, 0),
  }), [filtered]);

  return (
    <div style={{ padding: '24px 28px', display: 'grid', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em' }}>Loyalty cards</div>
          <div style={{ fontSize: 13, color: '#5C5F66' }}>
            {totals.total} cards · {totals.active} active · {totals.issued.toLocaleString()} total issued
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', border: '1px solid #EBEBEB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
            <Download size={14} color="#5C5F66" /> Export
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', background: '#1D9E75', color: 'white', border: 0, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={14} /> New card
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 10px', background: '#F5F6FA', borderRadius: 8, flex: '1 1 280px', minWidth: 220 }}>
          <Search size={14} color="#8A8D94" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cards or businesses…"
            style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', fontSize: 13, fontFamily: 'inherit', color: '#1A1A1F' }} />
        </div>
        <FilterDropdown label="Type" value={type} onChange={setType}
          options={[{ value: 'all', label: 'All types' }, { value: 'stamp', label: 'Stamp' }, { value: 'coupon', label: 'Coupon' }, { value: 'cashback', label: 'Cashback' }, { value: 'membership', label: 'Membership' }]} />
        <FilterDropdown label="Status" value={status} onChange={setStatus}
          options={[{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'draft', label: 'Draft' }, { value: 'paused', label: 'Paused' }]} />
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 2, background: '#F0F1F4', borderRadius: 9, padding: 3 }}>
          {(['grid', 'list'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              height: 26, padding: '0 10px', border: 0, borderRadius: 7,
              background: view === v ? 'white' : 'transparent',
              color: view === v ? '#1A1A1F' : '#5C5F66',
              fontSize: 12, fontWeight: view === v ? 500 : 400,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              textTransform: 'capitalize',
            }}>{v}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16, alignItems: 'start' }}>
        <div>
          {filtered.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 13, border: '1px solid #EBEBEB', padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>No cards match</div>
              <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 4 }}>Try clearing a filter or creating a new card.</div>
            </div>
          ) : view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filtered.map((c) => (
                <CardTile key={c.id} card={c} selected={selected?.id === c.id} onSelect={() => setSelected(selected?.id === c.id ? null : c)} />
              ))}
            </div>
          ) : (
            <CardsTable rows={filtered} selectedId={selected?.id ?? null} onSelect={(c) => setSelected(selected?.id === c.id ? null : c)} />
          )}
        </div>
        {selected && <CardDetail card={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}
