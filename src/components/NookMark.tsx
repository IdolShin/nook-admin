'use client';

import { useId } from 'react';

interface NookMarkProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  className?: string;
}

function NookMarkIcon({ size = 40 }: { size?: number }) {
  const raw = useId().replace(/:/g, '');
  const gId = `ng${raw}`;
  const sId = `ns${raw}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        <linearGradient id={gId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1D9E75" />
          <stop offset="100%" stopColor="#085041" />
        </linearGradient>
        <linearGradient id={sId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.18" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Background rounded square */}
      <rect x="0" y="0" width="40" height="40" rx="9" fill={`url(#${gId})`} />
      {/* Shine overlay */}
      <rect x="0" y="0" width="40" height="40" rx="9" fill={`url(#${sId})`} />
      {/* Geometric N — two verticals + diagonal, optically balanced */}
      <path
        d="M11 28V12h3.5l9 11.5V12H27v16h-3.5L14.5 16.5V28H11z"
        fill="white"
      />
    </svg>
  );
}

export default function NookMark({
  size = 32,
  showText = false,
  textColor,
  className,
}: NookMarkProps) {
  if (!showText) {
    return <NookMarkIcon size={size} />;
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      className={className}
    >
      <NookMarkIcon size={size} />
      <span
        style={{
          fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)',
          fontWeight: 700,
          fontSize: Math.round(size * 0.5),
          letterSpacing: '-0.4px',
          color: textColor ?? 'inherit',
          lineHeight: 1,
        }}
      >
        nook
      </span>
    </div>
  );
}
