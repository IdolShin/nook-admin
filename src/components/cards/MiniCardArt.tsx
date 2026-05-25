'use client';

import { typeMeta } from '@/lib/utils';

type CardData = {
  name: string; biz: string; type: string; reward: string;
  gradient: string[]; stamps: number | null; issued: number; redemptions: number; id: string;
};

function BarcodeStripes({ h = 32, opacity = 0.85 }: { h?: number; opacity?: number }) {
  return (
    <div style={{
      width: '100%', height: h, borderRadius: 4,
      background: `repeating-linear-gradient(90deg,
        rgba(255,255,255,${opacity}) 0px, rgba(255,255,255,${opacity}) 2px,
        rgba(255,255,255,0.12) 2px, rgba(255,255,255,0.12) 5px,
        rgba(255,255,255,${opacity}) 5px, rgba(255,255,255,${opacity}) 6px,
        rgba(255,255,255,0.12) 6px, rgba(255,255,255,0.12) 10px,
        rgba(255,255,255,${opacity}) 10px, rgba(255,255,255,${opacity}) 11px,
        rgba(255,255,255,0.12) 11px, rgba(255,255,255,0.12) 14px
      )`,
    }} />
  );
}

export default function MiniCardArt({ card, w = 240, h = 148 }: { card: CardData; w?: number; h?: number }) {
  const t = typeMeta[card.type] ?? typeMeta.stamp;
  const total = card.stamps || 10;
  const filled = Math.max(0, Math.min(total,
    Math.floor((card.redemptions / Math.max(1, card.issued)) * total) || Math.floor(total * 0.4)
  ));
  const shortId = card.id.replace(/-/g, '').slice(0, 12).toUpperCase();

  return (
    <div style={{
      width: w, height: h, borderRadius: 12,
      background: `linear-gradient(135deg, ${card.gradient[0]} 0%, ${card.gradient[1]} 100%)`,
      color: 'white', padding: 14,
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 6px 18px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(255,255,255,0.06)',
    }}>
      {/* Watermark */}
      <div style={{
        position: 'absolute', right: -10, bottom: -28, fontSize: 130,
        opacity: 0.10, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.04em', color: 'white',
      }}>{card.biz[0]}</div>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.8 }}>
          {card.biz}
        </div>
        <div style={{
          fontSize: 9, padding: '2px 6px', borderRadius: 999,
          background: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '.08em',
        }}>{t.label}</div>
      </div>

      {/* ── STAMP: dot grid ─────────────────────────────────── */}
      {card.type === 'stamp' && (
        <>
          <div style={{ marginTop: 10, fontSize: w > 220 ? 15 : 13, fontWeight: 600, letterSpacing: '-0.01em', position: 'relative' }}>
            {card.name}
          </div>
          <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2, position: 'relative', lineHeight: 1.3, maxWidth: '70%' }}>{card.reward}</div>
          <div style={{ position: 'absolute', left: 14, bottom: 12, display: 'flex', gap: w > 200 ? 5 : 4, flexWrap: 'wrap', maxWidth: w - 28 }}>
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} style={{
                width: w > 200 ? 12 : 9, height: w > 200 ? 12 : 9, borderRadius: 999,
                background: i < filled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.18)',
                border: i < filled ? 'none' : '1px dashed rgba(255,255,255,0.4)',
                flexShrink: 0,
              }} />
            ))}
          </div>
        </>
      )}

      {/* ── COUPON: barcode + reward text ───────────────────── */}
      {card.type === 'coupon' && (
        <>
          <div style={{ marginTop: 8, position: 'relative' }}>
            <div style={{ fontSize: w > 220 ? 20 : 16, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.15, maxWidth: w - 28 }}>
              {card.reward || card.name}
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
            <BarcodeStripes h={28} />
            <div style={{ fontSize: 8, opacity: 0.6, textAlign: 'center', marginTop: 3, fontFamily: 'monospace', letterSpacing: '.1em' }}>
              {shortId}
            </div>
          </div>
        </>
      )}

      {/* ── CASHBACK: big % number ──────────────────────────── */}
      {card.type === 'cashback' && (
        <>
          <div style={{ marginTop: 4, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: w > 220 ? 40 : 32, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {(card.reward.match(/\d+(\.\d+)?/) ?? ['5'])[0]}
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, opacity: 0.9 }}>%</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', opacity: 0.75, marginTop: 1 }}>
              CASHBACK
            </div>
          </div>
          <div style={{ fontSize: 10, opacity: 0.75, position: 'relative', marginTop: 4, lineHeight: 1.3 }}>{card.name}</div>
          <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
            <div style={{ fontSize: 9, opacity: 0.55, fontFamily: 'monospace', letterSpacing: '.08em' }}>
              ●●●● ●●●● {card.id.slice(-4).toUpperCase()}
            </div>
          </div>
        </>
      )}

      {/* ── MEMBERSHIP: barcode only ────────────────────────── */}
      {card.type === 'membership' && (
        <>
          <div style={{ marginTop: 8, fontSize: w > 220 ? 15 : 13, fontWeight: 600, letterSpacing: '-0.01em', position: 'relative' }}>
            {card.name}
          </div>
          <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2, position: 'relative', lineHeight: 1.3 }}>{card.reward}</div>
          <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
            <BarcodeStripes h={32} opacity={0.9} />
            <div style={{ fontSize: 8, opacity: 0.6, textAlign: 'center', marginTop: 3, fontFamily: 'monospace', letterSpacing: '.1em' }}>
              {shortId}
            </div>
          </div>
        </>
      )}

      {/* ── FALLBACK ─────────────────────────────────────────── */}
      {!['stamp', 'coupon', 'cashback', 'membership'].includes(card.type) && (
        <>
          <div style={{ marginTop: 10, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', position: 'relative' }}>
            {card.name}
          </div>
          <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2, position: 'relative' }}>{card.reward}</div>
          <div style={{ position: 'absolute', left: 14, bottom: 12, fontSize: 10, opacity: 0.85 }}>
            ●●●● ●●●● {card.id.toUpperCase()}
          </div>
        </>
      )}
    </div>
  );
}
