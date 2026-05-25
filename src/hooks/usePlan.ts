'use client';

import { useMemo } from 'react';

export type Plan = 'basic' | 'starter' | 'pro' | 'premium';

export interface PlanInfo {
  plan: Plan;
  isSuperadmin: boolean;
  isBasic: boolean;
  isPro: boolean;
  isPremium: boolean;
  customerLimit: number | null;   // null = unlimited
  cardLimit: number | null;       // null = unlimited
  pushLimitDays: number | null;   // null = unlimited (days between allowed pushes)
  canFilterAudience: boolean;
  canCreateCustomCoupon: boolean;
  allowedCardTypes: string[];
}

const PLAN_LIMITS: Record<string, Omit<PlanInfo, 'plan' | 'isSuperadmin' | 'isBasic' | 'isPro' | 'isPremium'>> = {
  basic: {
    customerLimit: 100,
    cardLimit: 1,
    pushLimitDays: 30,         // 1 per month
    canFilterAudience: false,
    canCreateCustomCoupon: false,
    allowedCardTypes: ['stamp'],
  },
  starter: {  // treat same as basic (legacy plan name)
    customerLimit: 100,
    cardLimit: 1,
    pushLimitDays: 30,
    canFilterAudience: false,
    canCreateCustomCoupon: false,
    allowedCardTypes: ['stamp'],
  },
  pro: {
    customerLimit: 500,
    cardLimit: 3,
    pushLimitDays: 7,          // 1 per week
    canFilterAudience: false,  // Pro: all only
    canCreateCustomCoupon: false,
    allowedCardTypes: ['stamp', 'cashback', 'coupon', 'membership'],
  },
  premium: {
    customerLimit: null,
    cardLimit: null,
    pushLimitDays: null,       // unlimited
    canFilterAudience: true,
    canCreateCustomCoupon: true,
    allowedCardTypes: ['stamp', 'cashback', 'coupon', 'membership'],
  },
};

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payload + '=='.slice((payload.length + 3) % 4 > 0 ? (payload.length + 3) % 4 - 1 : 0));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function usePlan(): PlanInfo {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return makeInfo('basic', false);
    }
    const token = localStorage.getItem('nook_token');
    if (!token) return makeInfo('basic', false);
    const payload = decodeJwt(token);
    if (!payload) return makeInfo('basic', false);
    const plan = (payload.plan as string)?.toLowerCase() ?? 'basic';
    const isSuperadmin = !!(payload.is_superadmin);
    return makeInfo(plan, isSuperadmin);
  }, []);
}

function makeInfo(planStr: string, isSuperadmin: boolean): PlanInfo {
  const plan = (planStr as Plan);
  const limits = PLAN_LIMITS[planStr] ?? PLAN_LIMITS.basic;
  return {
    plan,
    isSuperadmin,
    isBasic: planStr === 'basic' || planStr === 'starter',
    isPro: planStr === 'pro',
    isPremium: planStr === 'premium',
    ...limits,
  };
}
