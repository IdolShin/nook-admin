'use client';

import { useState } from 'react';

export default function NookDonutChart({
  data, size = 180, thickness = 22,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number; thickness?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2, cy = size / 2;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;

  let acc = 0;
  const segs = data.map((d) => {
    const start = acc;
    const len = (d.value / total) * C;
    acc += len;
    return { ...d, dasharray: `${len - 2} ${C - len + 2}`, dashoffset: -start };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0F0F2" strokeWidth={thickness} />
          {segs.map((s, i) => (
            <circle
              key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color}
              strokeWidth={hover === i ? thickness + 3 : thickness}
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.dashoffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-width 120ms', cursor: 'pointer' }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 11, color: '#8A8D94', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {hover != null ? data[hover].label : 'Total'}
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>
            {hover != null ? data[hover].value : total}
          </div>
          <div style={{ fontSize: 11, color: '#8A8D94' }}>
            {hover != null ? `${Math.round((data[hover].value / total) * 100)}%` : 'active cards'}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gap: 10 }}>
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 0', cursor: 'pointer',
              opacity: hover == null || hover === i ? 1 : 0.5,
              transition: 'opacity 120ms',
            }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: 'inline-block' }} />
              <span style={{ fontSize: 13 }}>{d.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#5C5F66', fontFamily: 'var(--font-mono)' }}>
                {Math.round((d.value / total) * 100)}%
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{d.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
