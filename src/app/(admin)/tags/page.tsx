'use client';

// ─── NFC Stamp Tags management ───────────────────────────────
// Register physical NTAG 424 DNA stamps, activate/deactivate, monitor taps.

import { useEffect, useState } from 'react';
import { api, ApiNfcTag } from '@/lib/api';

const CARD = { background: 'white', borderRadius: 16, border: '1px solid #EBEBEB', padding: 20 } as const;

export default function TagsPage() {
  const [tags, setTags] = useState<ApiNfcTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // new tag form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [uid, setUid] = useState('');
  const [metaKey, setMetaKey] = useState('');
  const [fileKey, setFileKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    try {
      setTags(await api.listTags());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tags');
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleCreate() {
    const u = uid.trim().replace(/[:\s]/g, '').toUpperCase();
    if (!/^[0-9A-F]{14}$/.test(u)) {
      setFormError('UID는 14자리 16진수여야 합니다 (예: 04AABBCCDDEE80). NFC Tools 앱으로 태그를 읽으면 확인할 수 있어요.');
      return;
    }
    setSaving(true); setFormError('');
    try {
      await api.createTag({
        name: name.trim() || 'NFC Stamp',
        uid: u,
        ...(metaKey.trim() ? { meta_key: metaKey.trim() } : {}),
        ...(fileKey.trim() ? { file_key: fileKey.trim() } : {}),
      });
      setName(''); setUid(''); setMetaKey(''); setFileKey(''); setShowForm(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to register tag');
    }
    setSaving(false);
  }

  async function toggleActive(t: ApiNfcTag) {
    try {
      await api.updateTag(t.id, { is_active: !t.is_active });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    }
  }

  async function handleDelete(t: ApiNfcTag) {
    if (!confirm(`"${t.name}" 태그를 삭제할까요? 삭제하면 이 스탬프로 더 이상 적립할 수 없습니다.`)) return;
    try {
      await api.deleteTag(t.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  return (
    <div style={{ padding: '16px 16px 40px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1F', margin: 0 }}>NFC Stamps</h1>
          <div style={{ fontSize: 13, color: '#8A8F98', marginTop: 3 }}>물리 NFC 스탬프 등록 · 관리 (NTAG 424 DNA)</div>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '11px 18px', borderRadius: 11, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #1D9E75, #085041)', color: 'white', fontSize: 14, fontWeight: 700,
        }}>
          {showForm ? '닫기' : '+ 스탬프 등록'}
        </button>
      </div>

      {error && <div style={{ ...CARD, borderColor: '#FCA5A5', background: '#FEF2F2', color: '#DC2626', fontSize: 13.5, marginBottom: 14 }}>{error}</div>}

      {showForm && (
        <div style={{ ...CARD, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1F', marginBottom: 14 }}>새 NFC 스탬프 등록</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: '#5A5F68' }}>이름</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 카운터 스탬프 1"
                style={{ width: '100%', marginTop: 5, padding: '11px 13px', border: '1.5px solid #D4E6DB', borderRadius: 9, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: '#5A5F68' }}>태그 UID (14자리 hex)</label>
              <input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="04AABBCCDDEE80"
                style={{ width: '100%', marginTop: 5, padding: '11px 13px', border: '1.5px solid #D4E6DB', borderRadius: 9, fontSize: 14, fontFamily: "'JetBrains Mono', monospace", outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ fontSize: 12, color: '#8A8F98', marginTop: 4 }}>
                휴대폰에 <b>NFC Tools</b> 앱을 설치하고 태그를 읽으면 &quot;Serial number&quot;로 표시됩니다. 콜론(:)은 자동 제거돼요.
              </div>
            </div>
            <details>
              <summary style={{ fontSize: 12.5, fontWeight: 700, color: '#5A5F68', cursor: 'pointer' }}>고급: 커스텀 AES 키 (기본값 = 공장 초기 키 00...0)</summary>
              <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                <input value={metaKey} onChange={(e) => setMetaKey(e.target.value)} placeholder="Meta Read Key (32 hex) — 비우면 기본 키"
                  style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #D4E6DB', borderRadius: 9, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", outline: 'none', boxSizing: 'border-box' }} />
                <input value={fileKey} onChange={(e) => setFileKey(e.target.value)} placeholder="File Read Key (32 hex) — 비우면 기본 키"
                  style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #D4E6DB', borderRadius: 9, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </details>
            {formError && <div style={{ color: '#DC2626', fontSize: 12.5 }}>{formError}</div>}
            <button onClick={handleCreate} disabled={saving} style={{
              padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: saving ? '#9CA3AF' : 'linear-gradient(135deg, #1D9E75, #085041)', color: 'white', fontSize: 14.5, fontWeight: 800,
            }}>
              {saving ? '등록 중…' : '등록하기'}
            </button>
          </div>
        </div>
      )}

      {/* Setup guide */}
      <div style={{ ...CARD, marginBottom: 16, background: '#F8FBFA' }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#085041', marginBottom: 8 }}>📋 태그 초기 설정 (한 번만)</div>
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#3A3F48', lineHeight: 1.9 }}>
          <li><b>NXP TagWriter</b> 앱 설치 → 태그 읽기 → UID 확인 → 위에서 등록</li>
          <li>TagWriter에서 <b>SDM(Mirroring) 활성화</b> 후 아래 URL 템플릿 기록:</li>
        </ol>
        <code style={{
          display: 'block', marginTop: 8, padding: '11px 13px', background: '#0D1B2E', color: '#7DE3C0',
          borderRadius: 9, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", overflowX: 'auto', whiteSpace: 'nowrap',
        }}>
          https://nook-wallet.com/t?picc_data=00000000000000000000000000000000&amp;cmac=0000000000000000
        </code>
        <div style={{ fontSize: 12, color: '#8A8F98', marginTop: 8, lineHeight: 1.7 }}>
          picc_data 자리에 <b>Encrypted PICC mirror</b>, cmac 자리에 <b>SDMMAC mirror</b>를 매핑하세요.
          설정 후 폰을 태그에 대면 적립 페이지가 자동으로 열립니다.
        </div>
      </div>

      {/* Tag list */}
      {loading ? (
        <div style={{ ...CARD, textAlign: 'center', color: '#8A8F98', fontSize: 14 }}>불러오는 중…</div>
      ) : tags.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 34 }}>🏷️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1F', marginTop: 10 }}>등록된 NFC 스탬프가 없어요</div>
          <div style={{ fontSize: 13, color: '#8A8F98', marginTop: 5 }}>위의 &quot;+ 스탬프 등록&quot; 버튼으로 첫 스탬프를 등록해보세요.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {tags.map((t) => (
            <div key={t.id} style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: t.is_active ? '#E8F7F2' : '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>
                🏷️
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1F' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#8A8F98', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                  UID {t.uid} · ctr {t.last_ctr}
                </div>
              </div>
              <div style={{ textAlign: 'right', marginRight: 4 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#1D9E75', fontFamily: "'JetBrains Mono', monospace" }}>{t.taps_30d ?? 0}</div>
                <div style={{ fontSize: 11, color: '#8A8F98' }}>taps · 30d</div>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                background: t.is_active ? '#E8F7F2' : '#F3F4F6',
                color: t.is_active ? '#085041' : '#8A8F98',
              }}>
                {t.is_active ? 'Active' : 'Off'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => toggleActive(t)} style={{
                  padding: '8px 13px', borderRadius: 9, cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                  border: '1.5px solid #D4E6DB', background: 'white', color: '#3A3F48',
                }}>
                  {t.is_active ? '비활성화' : '활성화'}
                </button>
                <button onClick={() => handleDelete(t)} style={{
                  padding: '8px 13px', borderRadius: 9, cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                  border: '1.5px solid #FCA5A5', background: 'white', color: '#DC2626',
                }}>
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
