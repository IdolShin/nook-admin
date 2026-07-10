import NookMark from '@/components/NookMark';

/**
 * Next.js built-in loading UI for the (admin) route group.
 * Headspace-inspired: warm cream, floating blobs, gentle bouncy logo.
 */
export default function AdminLoading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAF6EE',
        overflow: 'hidden',
        zIndex: 9999,
      }}
    >
      {/* soft blobs */}
      <div style={{
        position: 'absolute', width: 240, height: 240, left: -100, top: -70,
        borderRadius: '58% 42% 55% 45% / 52% 55% 45% 48%', background: '#DFF2E9',
        animation: 'nook-float 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 170, height: 170, right: -80, bottom: -50,
        borderRadius: '45% 55% 48% 52% / 55% 45% 55% 45%', background: '#FBF0D7',
        animation: 'nook-float 7.5s ease-in-out 800ms infinite',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative' }}>
        {/* Bouncing logo */}
        <div style={{ animation: 'nook-bounce 1.6s cubic-bezier(0.36,0,0.34,1) infinite' }}>
          <NookMark size={54} />
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontFamily: "Nunito, 'Pretendard Variable', Pretendard, system-ui, sans-serif",
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: '#26332C',
          }}
        >
          nook
        </div>

        {/* Cute bouncy dots */}
        <div style={{ display: 'flex', gap: 7, marginTop: 16 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: i === 1 ? '#E3A93C' : '#16A377',
                animation: `nook-hop 1.1s cubic-bezier(0.36,0,0.34,1) ${i * 0.14}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes nook-hop {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.55; }
          30%           { transform: translateY(-9px); opacity: 1; }
        }
        @keyframes nook-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-7px) scale(1.03); }
        }
        @keyframes nook-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
