'use client';

import NookMark from '@/components/NookMark';

export default function OfflinePage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#F5F6FA', padding: 24, textAlign: 'center',
    }}>
      <div style={{ marginBottom: 24 }}>
        <NookMark size={72} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A1F', marginBottom: 8 }}>
        You&apos;re offline
      </div>
      <div style={{ fontSize: 14, color: '#5C5F66', maxWidth: 280, lineHeight: 1.5, marginBottom: 24 }}>
        Check your internet connection and try again.
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          height: 44, padding: '0 28px',
          background: '#1D9E75', color: 'white',
          border: 0, borderRadius: 10,
          fontSize: 14, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        Retry
      </button>
    </div>
  );
}
