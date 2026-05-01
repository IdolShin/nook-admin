'use client';

import { typeMeta } from '@/lib/utils';

type CardData = {
  name: string; biz: string; type: string; reward: string;
  gradient: string[]; stamps: number | null; issued: number; redemptions: number; id: string;
};

export default function MiniCardArt({ card, w = 240, h = 148 }: { card: CardData; w?: number; h?: number }) {
  const t = typeMeta[card.type];
  const total = card.stamps || 10;
  const filled = Math.max(0, Math.min(total,
    Math.floor((card.redemptions / Math.max(1, card.issued)) * total) || Math.floor(total * 0.4)
  ));

  return (
    <div style={{
      width: w, height: h, borderRadius: 12,
      background: `linear-gradient(135deg, ${card.gradient[0]} 0%, ${card.gradient[1]} 100%)`,
      color: 'white', padding: 14,
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 6px 18px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(255,255,255,0.06)',
    }}>
      <div style={{
        position: 'absolute', right: -10, bottom: -28, fontSize: 130,
        opacity: 0.10, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.04em', color: 'white',
      }}>{card.biz[0]}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.8 }}>
          {card.biz}
        </div>
        <div style={{
          fontSize: 9, padding: '2px 6px', borderRadius: 999,
          background: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '.08em',
        }}>{t.label}</div>
      </div>

      <div style={{ marginTop: 10, fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', position: 'relative' }}>
        {card.name}
      </div>
      <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2, position: 'relative' }}>{card.reward}</div>

      {card.type === 'stamp' && (
        <div style={{ position: 'absolute', left: 14, bottom: 12, display: 'flex', gap: 5 }}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} style={{
              width: w > 200 ? 12 : 9, height: w > 200 ? 12 : 9, borderRadius: 999,
              background: i < filled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.18)',
              border: i < filled ? 'none' : '1px dashed rgba(255,255,255,0.4)',
            }} />
          ))}
        </div>
      )}
      {card.type !== 'stamp' && (
        <div style={{ position: 'absolute', left: 14, bottom: 12, fontSize: 10, opacity: 0.85 }}>
          ●●●● ●●●● {card.id.toUpperCase()}
        </div>
      )}
    </div>
  );
}
