'use client';

// ─── Shared shell for /terms and /privacy ─────────────────────
// Plain, readable, bilingual. Google's OAuth reviewers read these,
// so they must be reachable without logging in.

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

const FONT = "'Pretendard Variable', Pretendard, Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const DISPLAY = "Nunito, 'Pretendard Variable', Pretendard, sans-serif";
export const LT = {
  ink: '#26332C', brand: '#16A377', paper: '#FAF6EE',
  card: '#FFFFFF', line: '#EDE6D8', sub: '#5B6560', faint: '#7A8279',
};

export type Lang = 'en' | 'ko';

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 30 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, fontFamily: DISPLAY, color: LT.ink, margin: '0 0 10px', letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      <div style={{ fontSize: 14.5, lineHeight: 1.75, color: LT.sub }}>{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ margin: '10px 0 0', paddingLeft: 20 }}>
      {items.map((it, i) => (
        <li key={i} style={{ marginBottom: 7 }}>{it}</li>
      ))}
    </ul>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: 14, background: '#F1FAF5', border: `1px solid #CDEBDD`,
      borderRadius: 14, padding: '14px 16px', fontSize: 13.5, lineHeight: 1.7, color: LT.ink,
    }}>
      {children}
    </div>
  );
}

export default function LegalPage({
  eyebrow, title, updated, children, lang, setLang,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: React.ReactNode;
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  return (
    <div style={{
      minHeight: '100dvh', background: LT.paper, color: LT.ink, fontFamily: FONT,
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" />
      <style>{`a { color: ${LT.brand}; } * { -webkit-tap-highlight-color: transparent; }`}</style>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '26px 20px 70px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: LT.faint, textDecoration: 'none', fontWeight: 600 }}>
            <ArrowLeft size={15} /> {lang === 'en' ? 'Home' : '홈으로'}
          </a>
          <button onClick={() => {
            const n: Lang = lang === 'en' ? 'ko' : 'en';
            setLang(n);
            try { localStorage.setItem('nook_lang', n); } catch { /* non-fatal */ }
          }} style={{
            padding: '7px 13px', borderRadius: 999, cursor: 'pointer', fontFamily: FONT,
            background: LT.card, border: `1px solid ${LT.line}`, color: LT.faint, fontSize: 12, fontWeight: 700,
          }}>
            {lang === 'en' ? '한국어' : 'EN'}
          </button>
        </div>

        <div style={{ marginTop: 30 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', fontWeight: 800, color: LT.brand }}>{eyebrow}</div>
          <h1 style={{ fontSize: 30, fontWeight: 900, fontFamily: DISPLAY, letterSpacing: '-0.025em', margin: '10px 0 6px' }}>
            {title}
          </h1>
          <div style={{ fontSize: 13, color: LT.faint }}>{updated}</div>
        </div>

        <div style={{
          marginTop: 22, background: LT.card, border: `1px solid ${LT.line}`,
          borderRadius: 24, padding: '8px 24px 30px',
        }}>
          {children}
        </div>

        <div style={{ textAlign: 'center', fontSize: 12.5, color: LT.faint, marginTop: 26, lineHeight: 1.8 }}>
          <a href="/terms" style={{ textDecoration: 'none', fontWeight: 600 }}>{lang === 'en' ? 'Terms of Service' : '이용약관'}</a>
          {'  ·  '}
          <a href="/privacy" style={{ textDecoration: 'none', fontWeight: 600 }}>{lang === 'en' ? 'Privacy Policy' : '개인정보처리방침'}</a>
          <br />
          Nook Wallet · <a href="mailto:hello@nook-wallet.com" style={{ textDecoration: 'none' }}>hello@nook-wallet.com</a>
        </div>
      </div>
    </div>
  );
}

export function useLegalLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>('en');
  useEffect(() => {
    try { setLang((localStorage.getItem('nook_lang') as Lang) || 'en'); } catch { /* default en */ }
  }, []);
  return [lang, setLang];
}
