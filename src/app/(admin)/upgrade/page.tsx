'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, Star, Crown, ArrowLeft } from 'lucide-react';
import { usePlan } from '@/hooks/usePlan';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$79',
    period: '/mo',
    color: '#F59E0B',
    colorLight: '#FFFBEB',
    colorBorder: '#FCD34D',
    colorText: '#92400E',
    badge: 'BASIC',
    badgeBg: '#F59E0B',
    icon: Zap,
    description: 'Perfect for getting started',
    features: [
      'Up to 100 customers',
      '1 stamp card',
      'Google Wallet passes',
      'Push notifications (1/month)',
      'QR code enrollment',
      'Basic analytics',
    ],
    missing: [
      'Apple Wallet',
      'Coupon system',
      'Audience targeting',
      'Multiple card types',
    ],
    stripeLink: null, // TODO: add Stripe payment link
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$99',
    period: '/mo',
    color: '#16A34A',
    colorLight: '#F0FDF4',
    colorBorder: '#86EFAC',
    colorText: '#14532D',
    badge: 'PRO',
    badgeBg: '#16A34A',
    icon: Star,
    description: 'For growing businesses',
    popular: true,
    features: [
      'Up to 500 customers',
      'Up to 3 cards (all types)',
      'Google + Apple Wallet',
      'Push notifications (1/week)',
      'Coupon system',
      'QR code enrollment',
      'Advanced analytics',
    ],
    missing: [
      'Audience targeting',
      'Unlimited push',
      'Unlimited customers',
    ],
    stripeLink: null, // TODO: add Stripe payment link
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$129',
    period: '/mo',
    color: '#2563EB',
    colorLight: '#EFF6FF',
    colorBorder: '#93C5FD',
    colorText: '#1D4ED8',
    badge: 'PREMIUM',
    badgeBg: '#2563EB',
    icon: Crown,
    description: 'Unlimited everything',
    features: [
      'Unlimited customers',
      'Unlimited cards (all types)',
      'Google + Apple Wallet',
      'Unlimited push notifications',
      'Audience targeting (New/Active/Inactive)',
      'Coupon system',
      'Priority analytics',
      'Priority support',
      'Custom domain (coming soon)',
    ],
    missing: [],
    stripeLink: null, // TODO: add Stripe payment link
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const { plan: currentPlan, isSuperadmin } = usePlan();
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  function handleUpgrade(planId: string, stripeLink: string | null) {
    if (stripeLink) {
      window.location.href = stripeLink;
    } else {
      // Stripe not yet connected — show placeholder
      alert('Stripe payment coming soon! Contact us at hello@nook-wallet.com to upgrade manually.');
    }
  }

  const effectivePlan = isSuperadmin ? 'premium' : currentPlan;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 0, cursor: 'pointer', color: '#8A8D94', fontSize: 13, fontFamily: 'inherit', marginBottom: 16, padding: 0 }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A1A1F', letterSpacing: '-0.03em', marginBottom: 6 }}>
          Choose your plan
        </h1>
        <p style={{ fontSize: 14, color: '#8A8D94' }}>
          Upgrade anytime. Cancel anytime. All plans include a 14-day free trial.
        </p>
        {effectivePlan && effectivePlan !== 'basic' && effectivePlan !== 'starter' && (
          <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: '#E8F7F2', color: '#085041', fontSize: 12, fontWeight: 600 }}>
            <Check size={12} /> Currently on {effectivePlan.charAt(0).toUpperCase() + effectivePlan.slice(1)} plan
          </div>
        )}
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'start' }}>
        {PLANS.map((p) => {
          const isCurrentPlan = effectivePlan === p.id || (p.id === 'basic' && (effectivePlan === 'starter' || effectivePlan === 'basic'));
          const isHovered = hoveredPlan === p.id;
          const Icon = p.icon;

          return (
            <div
              key={p.id}
              onMouseEnter={() => setHoveredPlan(p.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              style={{
                background: isCurrentPlan ? p.colorLight : 'white',
                border: `2px solid ${isCurrentPlan || isHovered ? p.colorBorder : '#EBEBEB'}`,
                borderRadius: 16,
                padding: '24px 22px',
                position: 'relative',
                transition: 'border-color 150ms, box-shadow 150ms, transform 150ms',
                boxShadow: isHovered && !isCurrentPlan ? '0 8px 24px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.06)',
                transform: p.popular && !isCurrentPlan ? 'translateY(-4px)' : 'none',
              }}
            >
              {/* Popular badge */}
              {p.popular && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: p.badgeBg, color: 'white', fontSize: 10, fontWeight: 800, padding: '3px 14px', borderRadius: 20, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  MOST POPULAR
                </div>
              )}

              {/* Plan header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: p.colorLight, border: `1px solid ${p.colorBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={p.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#1A1A1F' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#8A8D94' }}>{p.description}</div>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, background: p.badgeBg, color: 'white', padding: '2px 8px', borderRadius: 20 }}>{p.badge}</span>
              </div>

              {/* Price */}
              <div style={{ marginBottom: 18 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: '#1A1A1F', letterSpacing: '-0.03em' }}>{p.price}</span>
                <span style={{ fontSize: 14, color: '#8A8D94' }}>{p.period}</span>
              </div>

              {/* CTA */}
              {isCurrentPlan ? (
                <div style={{ width: '100%', height: 40, background: p.colorLight, border: `1.5px solid ${p.colorBorder}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: p.color, marginBottom: 18 }}>
                  <Check size={14} style={{ marginRight: 6 }} /> Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(p.id, p.stripeLink)}
                  style={{ width: '100%', height: 40, background: p.color, color: 'white', border: 0, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 18, transition: 'opacity 120ms' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                >
                  Upgrade to {p.name}
                </button>
              )}

              {/* Divider */}
              <div style={{ height: 1, background: '#EBEBEB', marginBottom: 16 }} />

              {/* Features */}
              <div style={{ display: 'grid', gap: 8 }}>
                {p.features.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#1A1A1F' }}>
                    <Check size={14} color={p.color} style={{ flexShrink: 0, marginTop: 1 }} />
                    {f}
                  </div>
                ))}
                {p.missing.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#C0C0C0' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #E0E0E0', flexShrink: 0, marginTop: 1 }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#8A8D94' }}>
        Questions? Contact us at{' '}
        <a href="mailto:hello@nook-wallet.com" style={{ color: '#1D9E75', fontWeight: 600 }}>
          hello@nook-wallet.com
        </a>
        {' '}or visit{' '}
        <a href="/contact" style={{ color: '#1D9E75', fontWeight: 600 }}>
          our contact page
        </a>
        .
      </div>
    </div>
  );
}
