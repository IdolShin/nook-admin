import NookMark from '@/components/NookMark';

/**
 * Next.js built-in loading UI for the (admin) route group.
 * Shows while pages are loading / hydrating.
 * Logo positioned ~20% below visual center for a balanced, grounded feel.
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
        justifyContent: 'flex-start',
        paddingTop: 'calc(50vh + 4vh)',
        background: 'linear-gradient(160deg, #E8F4EE 0%, #F0F7F3 50%, #EDF3EF 100%)',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          transform: 'translateY(-50%)',
        }}
      >
        {/* Logo mark */}
        <NookMark size={52} />

        {/* Wordmark */}
        <div
          style={{
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            color: '#1A1A1F',
          }}
        >
          nook
        </div>

        {/* Subtle loading dots */}
        <div style={{ display: 'flex', gap: 5, marginTop: 14 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                background: '#1D9E75',
                opacity: 0.4,
                animation: `nook-pulse 1.2s ease-in-out ${i * 0.18}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes nook-pulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
          40%            { opacity: 1;    transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
