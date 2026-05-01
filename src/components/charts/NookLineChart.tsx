'use client';

import { useState } from 'react';

export default function NookLineChart({
  stamps, redeems, height = 220, showRedemptions = true,
}: {
  stamps: number[]; redeems: number[]; height?: number; showRedemptions?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 760, h = height;
  const pad = { l: 36, r: 14, t: 18, b: 26 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(...stamps, ...redeems) * 1.15;
  const min = 0;

  const x = (i: number) => pad.l + (i / (stamps.length - 1)) * innerW;
  const y = (v: number) => pad.t + innerH - ((v - min) / (max - min)) * innerH;

  const linePath = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
  const areaPath = (arr: number[]) => `${linePath(arr)} L${x(arr.length - 1)},${pad.t + innerH} L${x(0)},${pad.t + innerH} Z`;

  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((max / yTicks) * i));

  const today = new Date();
  const dayLabels = stamps.map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (stamps.length - 1 - i));
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  return (
    <div style={{ position: 'relative' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: 'block' }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * w;
          if (px < pad.l || px > pad.l + innerW) { setHover(null); return; }
          const idx = Math.round(((px - pad.l) / innerW) * (stamps.length - 1));
          setHover(Math.max(0, Math.min(stamps.length - 1, idx)));
        }}
      >
        <defs>
          <linearGradient id="g-stamps" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1D9E75" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1D9E75" stopOpacity="0" />
          </linearGradient>
        </defs>

        {tickVals.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} y1={y(t)} x2={pad.l + innerW} y2={y(t)} stroke="#F0F0F2" strokeWidth="1" />
            <text x={pad.l - 8} y={y(t) + 4} fontSize="11" fill="#8A8D94" textAnchor="end" fontFamily="JetBrains Mono">{t}</text>
          </g>
        ))}

        {stamps.map((_, i) =>
          (i % 5 === 0 || i === stamps.length - 1) ? (
            <text key={i} x={x(i)} y={h - 8} fontSize="11" fill="#8A8D94" textAnchor="middle" fontFamily="JetBrains Mono">
              {dayLabels[i]}
            </text>
          ) : null
        )}

        <path d={areaPath(stamps)} fill="url(#g-stamps)" />
        <path d={linePath(stamps)} fill="none" stroke="#1D9E75" strokeWidth="2.2" />

        {showRedemptions && (
          <path d={linePath(redeems)} fill="none" stroke="#3B6BCC" strokeWidth="2" opacity="0.85" />
        )}

        {hover != null && (
          <g>
            <line x1={x(hover)} y1={pad.t} x2={x(hover)} y2={pad.t + innerH} stroke="#D6D8DD" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(stamps[hover])} r="4.5" fill="white" stroke="#1D9E75" strokeWidth="2" />
            {showRedemptions && (
              <circle cx={x(hover)} cy={y(redeems[hover])} r="4" fill="white" stroke="#3B6BCC" strokeWidth="2" />
            )}
          </g>
        )}
      </svg>

      {hover != null && (
        <div className="chart-tooltip show" style={{
          left: `${(x(hover) / w) * 100}%`,
          top: `${(y(Math.max(stamps[hover], redeems[hover])) / h) * 100}%`,
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>{dayLabels[hover]}</div>
          <div style={{ color: '#7DD9B5' }}>● Stamps {stamps[hover]}</div>
          {showRedemptions && <div style={{ color: '#9DBBE8' }}>● Redeems {redeems[hover]}</div>}
        </div>
      )}
    </div>
  );
}
