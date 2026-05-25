'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface PassData {
  pass: {
    id: string
    barcode: string
    status: 'active' | 'redeemed' | 'expired'
    issued_at: string
    expires_at: string | null
    redeemed_at: string | null
  }
  coupon: {
    id: string
    title: string
    coupon_type: 'percent' | 'fixed' | 'bogo' | 'free_item'
    discount_value: number | null
    free_item_name: string | null
    description: string | null
    color: string
    terms: string | null
  }
  business: {
    id: string
    name: string
    logo_url: string | null
  }
  customer: { name: string } | null
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

function discountLabel(coupon: PassData['coupon']): string {
  if (coupon.coupon_type === 'percent') return `${coupon.discount_value}% OFF`
  if (coupon.coupon_type === 'fixed') return `$${coupon.discount_value} OFF`
  if (coupon.coupon_type === 'bogo') return 'Buy 1 Get 1'
  if (coupon.coupon_type === 'free_item') return coupon.free_item_name ? `Free ${coupon.free_item_name}` : 'Free Item'
  return coupon.title
}

function formatDate(iso: string | null) {
  if (!iso) return 'No expiry'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: '#E8F7F2', color: '#1D9E75', borderRadius: 20,
        padding: '5px 14px', fontSize: 13, fontWeight: 600
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1D9E75', display: 'inline-block' }} />
        Active
      </span>
    )
  }
  if (status === 'redeemed') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: '#F0F0F0', color: '#888', borderRadius: 20,
        padding: '5px 14px', fontSize: 13, fontWeight: 600
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#888', display: 'inline-block' }} />
        Redeemed
      </span>
    )
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: '#FFF3F0', color: '#E05A3A', borderRadius: 20,
      padding: '5px 14px', fontSize: 13, fontWeight: 600
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E05A3A', display: 'inline-block' }} />
      Expired
    </span>
  )
}

export default function PassPage() {
  const params = useParams()
  const barcode = params?.barcode as string

  const [data, setData] = useState<PassData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!barcode) return
    fetch(`${BASE}/api/coupons/pass/${encodeURIComponent(barcode)}`)
      .then(res => res.ok ? res.json() : res.json().then(j => Promise.reject(j.error || 'Not found')))
      .then(setData)
      .catch(err => setError(typeof err === 'string' ? err : 'Coupon not found'))
      .finally(() => setLoading(false))
  }, [barcode])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F5F7F6', flexDirection: 'column', gap: 12
      }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #E0E0E0', borderTopColor: '#1D9E75', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#888', fontSize: 14 }}>Loading coupon...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F5F7F6', flexDirection: 'column', gap: 16, padding: 24
      }}>
        <div style={{ fontSize: 48 }}>🎟️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', margin: 0, textAlign: 'center' }}>Coupon Not Found</h2>
        <p style={{ color: '#888', fontSize: 14, textAlign: 'center', margin: 0, maxWidth: 280 }}>
          This coupon may have expired or the link is invalid.
        </p>
      </div>
    )
  }

  const { pass, coupon, business } = data
  const cardColor = coupon.color || '#1D9E75'
  const isActive = pass.status === 'active'
  const label = discountLabel(coupon)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pass.barcode)}&bgcolor=ffffff&color=000000&margin=8`

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #F0F4F8 0%, #F5F7F6 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 16px 48px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif'
    }}>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 400, marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {business.logo_url ? (
            <img src={business.logo_url} alt={business.name} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: cardColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 16
            }}>
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span style={{ fontWeight: 700, fontSize: 17, color: '#1A1A1A' }}>{business.name}</span>
        </div>
      </div>

      {/* Coupon Card */}
      <div style={{
        width: '100%', maxWidth: 400,
        borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        background: '#fff',
        opacity: isActive ? 1 : 0.75
      }}>
        {/* Card Header */}
        <div style={{
          background: isActive
            ? `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}CC 100%)`
            : 'linear-gradient(135deg, #AAAAAA 0%, #888888 100%)',
          padding: '28px 24px 24px',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: 30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 6, letterSpacing: '-1px' }}>
              {label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.92)', marginBottom: 12 }}>
              {coupon.title}
            </div>
            {coupon.description && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5 }}>
                {coupon.description}
              </div>
            )}
          </div>
        </div>

        {/* Dashed divider */}
        <div style={{
          display: 'flex', alignItems: 'center',
          borderTop: '2px dashed #EBEBEB',
          margin: '0 0',
          padding: '0 16px',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', left: -14, width: 28, height: 28, borderRadius: '50%', background: '#F5F7F6', border: '2px solid #EBEBEB' }} />
          <div style={{ position: 'absolute', right: -14, width: 28, height: 28, borderRadius: '50%', background: '#F5F7F6', border: '2px solid #EBEBEB' }} />
        </div>

        {/* Barcode section */}
        <div style={{ padding: '24px 24px 28px', textAlign: 'center' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <StatusBadge status={pass.status} />
          </div>

          {/* QR Code */}
          <div style={{
            display: 'inline-block',
            padding: 12,
            background: '#fff',
            borderRadius: 16,
            border: '2px solid #EBEBEB',
            marginBottom: 16,
            opacity: isActive ? 1 : 0.5
          }}>
            <img
              src={qrUrl}
              alt="Coupon QR Code"
              width={160}
              height={160}
              style={{ display: 'block', borderRadius: 8 }}
            />
          </div>

          {/* Barcode number */}
          <div style={{
            fontFamily: '"JetBrains Mono", "Courier New", monospace',
            fontSize: 18, fontWeight: 700,
            color: isActive ? '#1A1A1A' : '#AAAAAA',
            letterSpacing: '0.12em',
            marginBottom: 8
          }}>
            {pass.barcode.replace(/(.{4})/g, '$1 ').trim()}
          </div>

          <p style={{ fontSize: 12, color: '#AAAAAA', margin: 0 }}>
            Show this QR code to the staff at the register
          </p>
        </div>

        {/* Info row */}
        <div style={{
          background: '#F8FAFB',
          padding: '16px 24px',
          display: 'flex', justifyContent: 'space-between',
          borderTop: '1px solid #F0F0F0'
        }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 11, color: '#AAAAAA', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issued</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#444' }}>{formatDate(pass.issued_at)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#AAAAAA', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {pass.status === 'redeemed' ? 'Redeemed' : 'Expires'}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: pass.status === 'redeemed' ? '#888' : (isActive ? '#444' : '#E05A3A') }}>
              {pass.status === 'redeemed' ? formatDate(pass.redeemed_at) : formatDate(pass.expires_at)}
            </div>
          </div>
        </div>

        {/* Terms */}
        {coupon.terms && (
          <div style={{ padding: '12px 24px 16px', borderTop: '1px solid #F0F0F0' }}>
            <p style={{ fontSize: 11, color: '#BBBBBB', margin: 0, lineHeight: 1.6 }}>
              Terms: {coupon.terms}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#CCCCCC', margin: 0 }}>
          Powered by{' '}
          <a href="https://nook-wallet.com" style={{ color: '#1D9E75', textDecoration: 'none', fontWeight: 600 }}>
            Nook Wallet
          </a>
        </p>
      </div>
    </div>
  )
}
