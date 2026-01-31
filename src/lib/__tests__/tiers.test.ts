import { describe, it, expect } from 'vitest';
import {
  PLANS,
  getPlan,
  getPlanByStripePriceId,
  canUsePrivateRepos,
  canUseCustomDomain,
  canUseEmailDigests,
  canHidePoweredBy,
  canUseCustomBranding,
  getMaxProjects,
  getMaxTeamMembers,
} from '../tiers';

// ============================================================================
// Plan Definitions
// ============================================================================

describe('PLANS', () => {
  it('defines exactly 3 plans', () => {
    expect(Object.keys(PLANS)).toEqual(['free', 'pro', 'team']);
  });

  it('free plan is $0', () => {
    expect(PLANS.free.price).toBe(0);
    expect(PLANS.free.priceYearly).toBe(0);
  });

  it('pro plan is $9/mo', () => {
    expect(PLANS.pro.price).toBe(900);
  });

  it('team plan is $29/mo', () => {
    expect(PLANS.team.price).toBe(2900);
  });

  it('yearly pricing is discounted', () => {
    // Pro: $84/yr = $7/mo effective (vs $9/mo)
    expect(PLANS.pro.priceYearly).toBeLessThan(PLANS.pro.price * 12);
    // Team: $276/yr = $23/mo effective (vs $29/mo)
    expect(PLANS.team.priceYearly).toBeLessThan(PLANS.team.price * 12);
  });

  it('only pro plan is highlighted', () => {
    expect(PLANS.free.highlighted).toBe(false);
    expect(PLANS.pro.highlighted).toBe(true);
    expect(PLANS.team.highlighted).toBe(false);
  });
});

// ============================================================================
// getPlan
// ============================================================================

describe('getPlan', () => {
  it('returns correct plan by id', () => {
    expect(getPlan('free').name).toBe('Free');
    expect(getPlan('pro').name).toBe('Pro');
    expect(getPlan('team').name).toBe('Team');
  });

  it('falls back to free for unknown plans', () => {
    expect(getPlan('enterprise' as any).id).toBe('free');
  });
});

// ============================================================================
// getPlanByStripePriceId
// ============================================================================

describe('getPlanByStripePriceId', () => {
  it('returns undefined for empty price ids (env not set)', () => {
    // In test env, Stripe IDs are empty strings
    expect(getPlanByStripePriceId('price_xxx')).toBeUndefined();
  });
});

// ============================================================================
// Feature Gates
// ============================================================================

describe('Feature gates', () => {
  describe('canUsePrivateRepos', () => {
    it('free: no', () => expect(canUsePrivateRepos('free')).toBe(false));
    it('pro: yes', () => expect(canUsePrivateRepos('pro')).toBe(true));
    it('team: yes', () => expect(canUsePrivateRepos('team')).toBe(true));
  });

  describe('canUseCustomDomain', () => {
    it('free: no', () => expect(canUseCustomDomain('free')).toBe(false));
    it('pro: yes', () => expect(canUseCustomDomain('pro')).toBe(true));
    it('team: yes', () => expect(canUseCustomDomain('team')).toBe(true));
  });

  describe('canUseEmailDigests', () => {
    it('free: no', () => expect(canUseEmailDigests('free')).toBe(false));
    it('pro: yes', () => expect(canUseEmailDigests('pro')).toBe(true));
    it('team: yes', () => expect(canUseEmailDigests('team')).toBe(true));
  });

  describe('canHidePoweredBy', () => {
    it('free: no', () => expect(canHidePoweredBy('free')).toBe(false));
    it('pro: yes', () => expect(canHidePoweredBy('pro')).toBe(true));
    it('team: yes', () => expect(canHidePoweredBy('team')).toBe(true));
  });

  describe('canUseCustomBranding', () => {
    it('free: no', () => expect(canUseCustomBranding('free')).toBe(false));
    it('pro: yes', () => expect(canUseCustomBranding('pro')).toBe(true));
    it('team: yes', () => expect(canUseCustomBranding('team')).toBe(true));
  });
});

// ============================================================================
// Limits
// ============================================================================

describe('Plan limits', () => {
  describe('getMaxProjects', () => {
    it('free: 2', () => expect(getMaxProjects('free')).toBe(2));
    it('pro: 20', () => expect(getMaxProjects('pro')).toBe(20));
    it('team: 100', () => expect(getMaxProjects('team')).toBe(100));
  });

  describe('getMaxTeamMembers', () => {
    it('free: 1 (solo)', () => expect(getMaxTeamMembers('free')).toBe(1));
    it('pro: 1 (solo)', () => expect(getMaxTeamMembers('pro')).toBe(1));
    it('team: 10', () => expect(getMaxTeamMembers('team')).toBe(10));
  });
});
