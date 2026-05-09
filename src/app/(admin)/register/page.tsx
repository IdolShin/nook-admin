'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { api } from '@/lib/api';

function PhoneFrame({ children, label }: { children: React.ReactNode; label?: string }) {
  const { isPhone } = useBreakpoint();
  const W = isPhone ? 272 : 320;
  const H = isPhone ? 560 : 660;
  const BR_OUTER = isPhone ? 38 : 44;
  const BR_INNER = isPhone ? 30 : 36;
  const NOTCH_W = isPhone ? 82 : 96;
  const NOTCH_H = isPhone ? 22 : 26;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: W, height: H, borderRadius: BR_OUTER, padding: 8,
        background: '#0E0E12',
        boxShadow: '0 30px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)',
        position: 'relative',
      }}>
        {/* Notch */}
        <div style={{
          position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
          width: NOTCH_W, height: NOTCH_H, borderRadius: 999, background: '#0E0E12', zIndex: 5,
        }} />
        <div style={{
          width: '100%', height: '100%', borderRadius: BR_INNER,
          overflow: 'hidden', background: 'white', color: '#1A1A1F',
          position: 'relative', display: 'flex', flexDirection: 'column',
        }}>
          {/* Status bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px 8px', fontSize: 12, fontWeight: 600 }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>9:41</span>
            <span style={{ width: 80 }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M1 8h2M5 6h2M9 4h2M13 2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <svg width="22" height="10" viewBox="0 0 22 10" fill="none"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="currentColor" /><rect x="2" y="2" width="14" height="6" rx="1" fill="currentColor" /></svg>
            </span>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
        </div>
      </div>
      {label && <div style={{ fontSize: 12, color: '#8A8D94' }}>{label}</div>}
    </div>
  );
}

function MiniCard({ w = 200, h = 124 }: { w?: number; h?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 14,
      background: 'linear-gradient(135deg, #0F4D38 0%, #1D9E75 100%)',
      color: 'white', padding: 14, position: 'relative', overflow: 'hidden',
      boxShadow: '0 12px 28px rgba(15,77,56,0.28)',
    }}>
      <div style={{ position: 'absolute', right: -8, bottom: -22, fontSize: 110, opacity: 0.12, fontWeight: 700, lineHeight: 1 }}>N</div>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.1em', opacity: 0.85 }}>NOOK CAFÃ</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>Coffee lovers</div>
      <div style={{ fontSize: 9, opacity: 0.85, marginTop: 1 }}>Free latte after 10 stamps</div>
      <div style={{ position: 'absolute', bottom: 12, left: 14, display: 'flex', gap: 4 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} style={{ width: 9, height: 9, borderRadius: 999, background: i < 3 ? 'white' : 'rgba(255,255,255,0.2)', border: i >= 3 ? '1px dashed rgba(255,255,255,0.4)' : 'none' }} />
        ))}
      </div>
    </div>
  );
}

const ctaStyle: React.CSSProperties = {
  width: '100%', height: 50, border: 0, borderRadius: 14,
  background: '#1A1A1F', color: 'white',
  fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};

function Step0({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ padding: '12px 24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0 18px' }}>
        <MiniCard />
      </div>
      <div style={{ textAlign: 'center', padding: '0 4px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', color: '#1D9E75', textTransform: 'uppercase' }}>Nook CafÃ©</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 6 }}>Get your loyalty card</div>
        <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 8, lineHeight: 1.5 }}>
          Earn a free latte after 10 stamps. Lives right inside your wallet â no app to download.
        </div>
      </div>
      <div style={{ marginTop: 24, padding: 14, background: '#F5F6FA', borderRadius: 12, fontSize: 12, color: '#5C5F66', display: 'grid', gap: 8 }}>
        {['Add the card to your wallet', 'Show it at checkout for stamps', 'Redeem rewards in-store'].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 18, height: 18, borderRadius: 6, background: '#E8F7F2', color: '#085041', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
            {s}
          </div>
        ))}
      </div>
      <button onClick={onNext} style={{ ...ctaStyle, marginTop: 22 }}>Continue</button>
    </div>
  );
}

function Step1({
  name, phone, loading, error,
  onNameChange, onPhoneChange, onNext,
}: {
  name: string; phone: string; loading: boolean; error: string;
  onNameChange: (v: string) => void; onPhoneChange: (v: string) => void; onNext: () => void;
}) {
  const inputStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '0 12px', height: 50, border: '1px solid #EBEBEB', borderRadius: 12,
  };
  return (
    <div style={{ padding: '20px 24px 28px' }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Sign up</div>
      <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 6, lineHeight: 1.5 }}>Enter your name and phone to get your loyalty card.</div>
      {error && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: '#FBE2EC', borderRadius: 10, fontSize: 12, color: '#C53A6B' }}>{error}</div>
      )}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, color: '#8A8D94', marginBottom: 6 }}>Name</div>
        <div style={inputStyle}>
          <input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Jane Smith"
            style={{ flex: 1, border: 0, outline: 0, fontSize: 15, fontFamily: 'inherit' }} />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, color: '#8A8D94', marginBottom: 6 }}>Mobile</div>
        <div style={inputStyle}>
          <span style={{ fontSize: 14, color: '#5C5F66', fontFamily: 'var(--font-mono)' }}>+1</span>
          <input value={phone} onChange={(e) => onPhoneChange(e.target.value)} placeholder="(201) 555-0142"
            style={{ flex: 1, border: 0, outline: 0, fontSize: 15, fontFamily: 'inherit', letterSpacing: '0.5px' }} />
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#8A8D94', marginTop: 14, lineHeight: 1.5 }}>
        By continuing, you agree to receive transactional and promotional messages from Nook CafÃ©. Reply STOP anytime.
      </div>
      <button onClick={onNext} disabled={loading} style={{ ...ctaStyle, marginTop: 22, opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </div>
  );
}

function Step2({ onNext }: { onNext: () => void }) {
  const digits = ['1', '8', '2', ' ', ' ', ' '];
  return (
    <div style={{ padding: '20px 24px 28px' }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Enter the code</div>
      <div style={{ fontSize: 13, color: '#5C5F66', marginTop: 6, lineHeight: 1.5 }}>
        We sent a 6-digit code to <span style={{ fontFamily: 'var(--font-mono) ' }}>+1 (201) 555-0142</span>.
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 28, justifyContent: 'center' }}>
        {digits.map((c, i) => (
          <div key={i} style={{
            width: 38, height: 50, borderRadius: 10,
            border: c.trim() ? '2px solid #1D9E75' : '1px solid #EBEBEB',
            background: c.trim() ? '#E8F7F2' : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)',
          }}>{c.trim()}</div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 22, fontSize: 12, color: '#8A8D94' }}>
        Didn&apos;t get it? <span style={{ color: '#085041', fontWeight: 500 }}>Resend in 0:24</span>
      </div>
      <button onClick={onNext} style={{ ...ctaStyle, marginTop: 28 }}>Verify</button>
    </div>
  );
}

function Step3({ onNext }: { onNext: () => void }) {
  const AppleLogo = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M17.05 11.97c-.03-2.93""ã3ÓBã3""ãRÓBã3Óã3bÓãÓ2ãCÓ"ã#rÓBã#BÓ"ã2ÓãÒãÓ2ãS2ãbÓBãCRãbÒã2Ó"ã3BÓãBÓ2ãRÓãÓãã2Ó2ããRÓBã2"ã2Ó"ãb2ãSrÒãS2ãbãCãsbããC""ãb2ã2ãr"ãRãCÒãb"ãRÒãb2ãRÒãbãs"ã3ãb2ãã2ãbÒã2"ãcÓãCB2ãSÓ"ãbã2ÓãcBãbÓ2ã#2ãc"Ó2ã3ÒãBÒã"Ó2ãÓãÓ2ãBÓBãs7¤ÓBãr2ãv2ã2Óã3Ó"ã3ã#2Ó2ãsÓã"ãRÓ"ãcRãÓ2ãRãsÒãsrãÓãCB"ã#Óã#b2ãcbã3Bã"ãrÒãc2ãS2Óãcw¢"óà¢Â÷7fsà¢°¢&WGW&â¢ÆFb7GÆS×·²FFæs¢s##G#rÂF7Æ¢vfÆWrÂfÆWF&V7Föã¢v6öÇVÖârÂVvC¢sRr×Óà¢ÆFb7GÆS×·²föçE6¦S¢#"ÂföçEvVvC¢sÂÆWGFW%76æs¢rÓã&VÒr×ÓäFBFòvÆÆWCÂöFcà¢ÆFb7GÆS×·²föçE6¦S¢2Â6öÆ÷#¢r3T3TccbrÂÖ&våF÷¢bÂÆæTVvC¢ãR×Óå÷W"6&B2&VGâFBBFò¶VWBæGãÂöFcà¢ÆFb7GÆS×·²F7Æ¢vfÆWrÂ§W7Fg6öçFVçC¢v6VçFW"rÂFFæs¢s#r×Óà¢ÄÖæ6&Bs×³#CÒ×³CÒóà¢ÂöFcà¢Æ'WGFöâöä6Æ6³×¶öäæWGÒ7GÆS×·°¢ââæ7F7GÆRÂ&6¶w&÷VæC¢v&Æ6²rÀ¢F7Æ¢vfÆWrÂÆväFV×3¢v6VçFW"rÂ§W7Fg6öçFVçC¢v6VçFW"rÂv¢À¢×Óà¢ÄÆTÆövòóâFBFòÆRvÆÆW@¢Âö'WGFöãà¢Æ'WGFöâöä6Æ6³×¶öäæWGÒ7GÆS×·°¢ââæ7F7GÆRÂÖ&våF÷¢À¢&6¶w&÷VæC¢wvFRrÂ6öÆ÷#¢r3brÀ¢&÷&FW#¢s6öÆB4T$T$T"rÀ¢×Óà¢6fRFòvöövÆRvÆÆW@¢Âö'WGFöãà¢ÂöFcà¢°§Ð ¦gVæ7Föâ7FWB°¢&WGW&â¢ÆFb7GÆS×·²FFæs¢sc#G#rÂFWDÆvã¢v6VçFW"r×Óà¢ÆFb7GÆS×·²vGF¢s"ÂVvC¢s"ÂÖ&vã¢sWFò#rÂ&÷&FW%&FW3¢Â&6¶w&÷VæC¢r4Sctc"rÂF7Æ¢vfÆWrÂÆväFV×3¢v6VçFW"rÂ§W7Fg6öçFVçC¢v6VçFW"r×Óà¢Ç7frvGFÒ#3b"VvCÒ#3b"fWt&÷Ò##B#B"fÆÃÒ&æöæR"7G&ö¶SÒ"3CSsR"7G&ö¶UvGFÒ#"ãB"7G&ö¶TÆæV6Ò'&÷VæB"7G&ö¶TÆæV¦öãÒ'&÷VæB#à¢ÇFCÒ&ÓR"RTÃ#r"óà¢Â÷7fsà¢ÂöFcà¢ÆFb7GÆS×·²föçE6¦S¢#"ÂföçEvVvC¢sÂÆWGFW%76æs¢rÓã&VÒr×Óå÷Rf÷3·&RâÂöFcà¢ÆFb7GÆS×·²föçE6¦S¢2Â6öÆ÷#¢r3T3TccbrÂÖ&våF÷¢ÂÆæTVvC¢ãR×Óà¢÷W"æöö²6l:6&B2æ÷râ÷W"vÆÆWBâ6÷rBB6V6¶÷WBFò7F'BV&æær7F×2à¢ÂöFcà¢ÆFb7GÆS×·²Ö&våF÷¢#BÂFFæs¢BÂ&6¶w&÷VæC¢r4cTcddrÂ&÷&FW%&FW3¢"ÂFWDÆvã¢vÆVgBr×Óà¢ÆFb7GÆS×·²föçE6¦S¢ÂföçEvVvC¢cÂ6öÆ÷#¢r3CBrÂÆWGFW%76æs¢rãfVÒrÂFWEG&ç6f÷&Ó¢wWW&66Rr×ÓåvVÆ6öÖR&öçW3ÂöFcà¢ÆFb7GÆS×·²föçE6¦S¢BÂföçEvVvC¢cÂÖ&våF÷¢B×Óãg&VR7F×öâW2²uÇW³c3ÒwÓÂöFcà¢ÆFb7GÆS×·²föçE6¦S¢"Â6öÆ÷#¢r3T3TccbrÂÖ&våF÷¢B×ÓäBf÷3·2Ç&VGöâ÷W"6&Bâ§W7BÖ÷&RFòg&VRÆGFRãÂöFcà¢ÂöFcà¢ÂöFcà¢°§Ð ¦6öç7B5DUôÄ$TÅ2Ò²u"ÆæFærrÂu&Vv7FW"rÂufW&grÂtFBFòvÆÆWBrÂtFöæRuÓ°¦6öç7B5DUõ4õ%BÒ²u"rÂu&Vv7FW"rÂufW&grÂuvÆÆWBrÂtFöæRuÓ° ¦gVæ7Föâ&Vv7FW%vTææW"°¢6öç7B·7FWÂ6WE7FWÒÒW6U7FFR°¢6öç7B¶æÖRÂ6WDæÖUÒÒW6U7FFRrr°¢6öç7B·öæRÂ6WEöæUÒÒW6U7FFRrr°¢6öç7B¶ÆöFærÂ6WDÆöFæuÒÒW6U7FFRfÇ6R°¢6öç7B·&VtW'&÷"Â6WE&VtW'&÷%ÒÒW6U7FFRrr°¢6öç7B²5öæRÒÒW6T'&V·öçB°¢6öç7B6V&6&×2ÒW6U6V&6&×2°¢6öç7B6&DBÒ6V&6&×2ævWBv6&EöBróòrs° ¢gVæ7FöâGfæ6R²6WE7FW2ÓâÖFæÖâ2²Â5DUôÄ$TÅ2æÆVæwFÒ²Ð ¢7æ2gVæ7FöâæFÆU&Vv7FW"°¢bæÖRçG&ÒÇÂöæRçG&Ò°¢6WE&VtW'&÷"uÆV6RVçFW"÷W"æÖRæBöæRçVÖ&W"âr°¢&WGW&ã°¢Ð¢b6&DB°¢6WE&VtW'&÷"tæò6&B6VÆV7FVBâ÷VâF2vRfFR6&B"6öFRâr°¢&WGW&ã°¢Ð¢6WDÆöFærG'VR°¢6WE&VtW'&÷"rr°¢G'°¢vBç&Vv7FW$7W7FöÖW"²6&EöC¢6&DBÂæÖS¢æÖRçG&ÒÂöæS¢öæRçG&ÒÒ°¢Gfæ6R°¢Ò6F6S¢Væ¶æ÷vâ°¢6WE&VtW'&÷"Rç7Fæ6VöbW'&÷"òRæÖW76vR¢u&Vv7G&FöâfÆVBr°¢ÒfæÆÇ°¢6WDÆöFærfÇ6R°¢Ð¢Ð ¢6öç7B5DUôäôDU3¢&V7Bå&V7DæöFUµÒÒ°¢Å7FW¶W×³ÒöäæWC×¶Gfæ6WÒóâÀ¢Å7FW¶W×³ÒæÖS×¶æÖWÒöæS×·öæWÒÆöFæs×¶ÆöFæwÒW'&÷#×·&VtW'&÷'Ð¢öäæÖT6ævS×·6WDæÖWÒöåöæT6ævS×·6WEöæWÒöäæWC×¶æFÆU&Vv7FW'ÒóâÀ¢Å7FW"¶W×³'ÒöäæWC×¶Gfæ6WÒóâÀ¢Å7FW2¶W×³7ÒöäæWC×¶Gfæ6WÒóâÀ¢Å7FWB¶W×³GÒóâÀ¢Ó° ¢&WGW&â¢ÆFb7GÆS×·²ÖäVvC¢sfrÂ&6¶w&÷VæC¢r4cTcddrÂFFæs¢5öæRòsgr¢s#G#r×Óà¢ÆFb7GÆS×·²ÖvGF¢cÂÖ&vã¢sWFòr×Óà ¢²ò¢VFW"6&B¢÷Ð¢ÆFb7GÆS×·²&6¶w&÷VæC¢wvFRrÂ&÷&FW%&FW3¢2Â&÷&FW#¢s6öÆB4T$T$T"rÂFFæs¢5öæRòsGgr¢ÂÖ&vä&÷GFöÓ¢#×Óà¢ÆFb7GÆS×·²Ö&vä&÷GFöÓ¢"×Óà¢ÆFb6Æ74æÖSÒ'6V7Föâ×FFÆR"7GÆS×·²föçE6¦S¢5öæRòR¢VæFVfæVB×Óä7W7FöÖW"&Vv7G&FöâfÆ÷sÂöFcà¢ÆFb7GÆS×·²föçE6¦S¢"Â6öÆ÷#¢r3CBrÂÖ&våF÷¢"×Óà¢vB7W7FöÖW'26VRvVâFW66âæöö²"6öFRà¢¶6&DBbbÇ7â7GÆS×·²Ö&väÆVgC¢bÂ6öÆ÷#¢r3CSsRrÂföçDfÖÇ¢wf"ÒÖföçBÖÖöæòr×Óæ6&C¢¶6&DBç6Æ6RÂÞ(
cÂ÷7ãçÐ¢ÂöFcà¢ÂöFcà ¢²ò¢7FWF'2¢÷Ð¢ÆFb7GÆS×·²÷fW&fÆ÷u¢vWFòrÂ÷fW&fÆ÷u¢vFFVârÂvV&¶D÷fW&fÆ÷u67&öÆÆæs¢wF÷V6rÂ67&öÆÆ&%vGF¢væöæRrÂ×4÷fW&fÆ÷u7GÆS¢væöæRr×Óà¢ÆFb7GÆS×·²F7Æ¢vfÆWrÂv¢BÂ&6¶w&÷VæC¢r4cccBrÂ&÷&FW%&FW3¢ÂFFæs¢2ÂvGF¢vÖÖ6öçFVçBrÂÖåvGF¢sRr×Óà¢²5öæRò5DUõ4õ%B¢5DUôÄ$TÅ2æÖ2ÂÓâ¢Æ'WGFöâ¶W×¶Òöä6Æ6³×²Óâ6WE7FWÒ7GÆS×·°¢VvC¢#ÂFFæs¢srÂ&÷&FW#¢Â&÷&FW%&FW3¢rÀ¢&6¶w&÷VæC¢7FWÓÓÒòwvFRr¢wG&ç7&VçBrÀ¢6öÆ÷#¢7FWÓÓÒòr3br¢r3T3TccbrÀ¢föçE6¦S¢5öæRò¢"ÂföçEvVvC¢7FWÓÓÒòc¢CÀ¢7W'6÷#¢wöçFW"rÂföçDfÖÇ¢væW&BrÂvFU76S¢væ÷w&rÀ¢&÷6F÷s¢7FWÓÓÒòs7&v&ÃÃÃãr¢væöæRrÂfÆW6&æ³¢À¢×Óç¶²Òâ·7ÓÂö'WGFöãà¢Ð¢ÂöFcà¢ÂöFcà¢ÂöFcà ¢²ò¢öæRÖö6·W²FW67&Föâ¢÷Ð¢ÆFb7GÆS×·²F7Æ¢vfÆWrÂfÆWF&V7Föã¢5öæRòv6öÇVÖâr¢w&÷rrÂv¢5öæRò#¢3"ÂÆväFV×3¢5öæRòv6VçFW"r¢vfÆW×7F'Br×Óà¢ÆFb7GÆS×·²fÆW6&æ³¢×Óà¢ÅöæTg&ÖRÆ&VÃ×¶7FWG·7FW²ÒöbGµ5DUôÄ$TÅ2æÆVæwFÖÓà¢µ5DUôäôDU5·7FW×Ð¢ÂõöæTg&ÖSà¢ÂöFcà ¢²ò¢FW67&FöâæVÂ¢÷Ð¢ÆFb7GÆS×·²fÆW¢ÂÖåvGF¢×Óà¢ÆFb7GÆS×·²&6¶w&÷VæC¢wvFRrÂ&÷&FW%&FW3¢2Â&÷&FW#¢s6öÆB4T$T$T"rÂFFæs¢5öæRòb¢#×Óà¢ÆFb7GÆS×·²föçE6¦S¢2ÂföçEvVvC¢cÂ6öÆ÷#¢r3CBrÂFWEG&ç6f÷&Ó¢wWW&66RrÂÆWGFW%76æs¢rãfVÒrÂÖ&vä&÷GFöÓ¢"×Óà¢7FW·7FW²Ò(	Bµ5DUôÄ$TÅ5·7FW×Ð¢ÂöFcà¢·7FWÓÓÒbb¢Ãà¢ÆFb7GÆS×·²föçE6¦S¢BÂÆæTVvC¢ãbÂ6öÆ÷#¢r3br×Óä7W7FöÖW"66ç2FR"6öFRæBÆæG2öâFRvVÆ6öÖR67&VVâãÂöFcà¢ÇVÂ7GÆS×·²föçE6¦S¢2Â6öÆ÷#¢r3T3TccbrÂÆæTVvC¢ãÂÖ&våF÷¢ÂFFætÆVgC¢×Óà¢ÆÆå6÷w2FRÆ÷ÇG6&BvF÷W"'&æB6öÆ÷'3ÂöÆà¢ÆÆäWÆç2FR&Wv&BRærâg&VRÆGFRgFW"7F×2ÂöÆà¢ÆÆäöæR×FfÆ÷r(	BæòF÷væÆöBæVVFVCÂöÆà¢Â÷VÃà¢Âóà¢Ð¢·7FWÓÓÒbb¢Ãà¢ÆFb7GÆS×·²föçE6¦S¢BÂÆæTVvC¢ãbÂ6öÆ÷#¢r3br×Óä7W7FöÖW"VçFW'2FV"æÖRæBöæRçVÖ&W"âF27&VFW2FV"66÷VçBæBÆæ·2BFò÷W"6&BãÂöFcà¢ÇVÂ7GÆS×·²föçE6¦S¢2Â6öÆ÷#¢r3T3TccbrÂÆæTVvC¢ãÂÖ&våF÷¢ÂFFætÆVgC¢×Óà¢ÆÆä6ÆÇ2Æ6öFR7GÆS×·²&6¶w&÷VæC¢r4cTcddrÂFFæs¢sWrÂ&÷&FW%&FW3¢BÂföçDfÖÇ¢wf"ÒÖföçBÖÖöæòrÂföçE6¦S¢"×Óåõ5Böö7W7FöÖW'2÷&Vv7FW#Âö6öFSãÂöÆà¢ÆÆæ6&EöB&VBg&öÒFR"6öFRU$Â&ÓÂöÆà¢ÆÆä7W7FöÖW"V'2ç7FçFÇâ÷W"7W7FöÖW'2Æ7CÂöÆà¢Â÷VÃà¢²6&DBbb¢ÆFb7GÆS×·²Ö&våF÷¢ÂFFæs¢sGrÂ&6¶w&÷VæC¢r4d$TdCrÂ&÷&FW%&FW3¢ÂföçE6¦S¢"Â6öÆ÷#¢r43#d#br×Óà¢æò6&EöBâU$ÂâFBÆ6öFR7GÆS×·²föçDfÖÇ¢wf"ÒÖföçBÖÖöæòr×Óãö6&EöCÕõU%ô4$EôCÂö6öFSâFòFW7BFR&VÂ
