'use client';

export default function NookStackedBar({
  data,
}: {
  data: { name: string; stamps: number; redemptions: number; color: string }[];
}) {
  const max = Math.max(...data.map((d) => d.stamps + d.redemptions));

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {data.map((d, i) => {
        const stampPct = (d.stamps / max) * 100;
        const redeemPct = (d.redemptions / max) * 100;
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</span>
              <span style={{ fontSize: 12, color: '#5C5F66', fontFamily: 'var(--font-mono)' }}>
                {(d.stamps + d.redemptions).toLocaleString()}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: '#F0F0F2', display: 'flex', overflow: 'hidden' }}>
              <div title={`Stamps ${String.fromCharCode(183)} ${d.stamps}`} style={{ width: `${stampPct}%`, background: d.color, transition: 'width 400ms ease' }} />
              <div title={`Redemptions ${String.fromCharCode(183)} ${d.redemptions}`} style={{ width: `${redeemPct}%`, background: d.color, opacity: 0.32, transition: 'width 400ms ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
