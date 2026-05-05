'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import NookMark from '@/components/NookMark';

function ScanLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/scan';
  const bizFromUrl = searchParams.get('biz') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bizId, setBizId] = useState(bizFromUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, go straight to scanner
  useEffect(() => {
    try {
      const token = api.getToken();
      if (token) router.replace(redirectTo);
    } catch {}
  }, [router, redirectTo]);

  async function handleSubmit() {
    if (!email || !password || !bizId) {
      setError('모든 항목을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.staffLogin(email.trim(), password, bizId.trim());
      router.push(redirectTo);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '로그인 실패';
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.error ?? msg);
      } catch {
        setError('이메일/비밀번호/Business ID를 확인해주세요.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F6FA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'white',
        borderRadius: 16,
        border: '1px solid #EBEBEB',
        padding: '40px 32px 32px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
      }}>
        <div style={{ marginBottom: 28 }}>
          <NookMark size={28} showText textColor="#1A1A1F" />
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
          스캐너 로그인
        </div>
        <div style={{ fontSize: 13, color: '#5C5F66', marginBottom: 28 }}>
          스태프 계정으로 로그인하세요.
        </div>

        {/* Email */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#5C5F66', fontWeight: 500, marginBottom: 6 }}>
            이메일
          </label>
          <input
            type="email"
            placeholder="scanner@nookcafe.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{
              width: '100%', height: 42, padding: '0 12px',
              border: '1px solid #EBEBEB', borderRadius: 10,
              fontSize: 14, fontFamily: 'inherit', outline: 'none',
              color: '#1A1A1F', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#5C5F66', fontWeight: 500, marginBottom: 6 }}>
            비밀번호
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{
              width: '100%', height: 42, padding: '0 12px',
              border: '1px solid #EBEBEB', borderRadius: 10,
              fontSize: 14, fontFamily: 'inherit', outline: 'none',
              color: '#1A1A1F', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Business ID — hidden if provided via URL */}
        {!bizFromUrl && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#5C5F66', fontWeight: 500, marginBottom: 6 }}>
              Business ID
            </label>
            <input
              type="text"
              placeholder="업장 ID를 입력하세요"
              value={bizId}
              onChange={e => setBizId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%', height: 42, padding: '0 12px',
                border: '1px solid #EBEBEB', borderRadius: 10,
                fontSize: 13, fontFamily: 'monospace', outline: 'none',
                color: '#1A1A1F', boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {error && (
          <div style={{
            fontSize: 12, color: '#9C2848', marginBottom: 12,
            padding: '8px 12px', background: '#FBE2EC', borderRadius: 8,
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', height: 44, marginTop: 4,
            border: 0, borderRadius: 10,
            background: loading ? '#8A8D94' : '#1D9E75',
            color: 'white', fontSize: 14, fontWeight: 600,
            cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
          }}
        >
          {loading ? '로그인 중…' : '로그인'}
        </button>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#8A8D94' }}>
          업장 관리자이신가요?{' '}
          <a href="/auth" style={{ color: '#085041', fontWeight: 500, textDecoration: 'none' }}>
            관리자 로그인 →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ScanLoginPage() {
  return (
    <Suspense>
      <ScanLoginForm />
    </Suspense>
  );
}
