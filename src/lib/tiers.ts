// ============================================================================
// ShipLog Billing Tiers — Feature gates & plan definitions
// ============================================================================

export type PlanId = 'free' | 'pro' | 'team';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: number; // monthly USD cents
  priceYearly: number; // yearly USD cents (per year, not per month)
  stripePriceMonthly: string; // Stripe price ID (set in env)
  stripePriceYearly: string;
  features: {
    maxProjects: number;
    privateRepos: boolean;
    customDomain: boolean;
    emailDigests: boolean;
    customBranding: boolean;
    hidePoweredBy: boolean;
    embedWidget: boolean;
    prioritySupport: boolean;
    teamMembers: number; // 1 = solo
    apiAccess: boolean;
  };
  badge: string;
  description: string;
  highlighted: boolean;
}

// Plan definitions — Stripe price IDs come from env
export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceYearly: 0,
    stripePriceMonthly: '',
    stripePriceYearly: '',
    features: {
      maxProjects: 2,
      privateRepos: false,
      customDomain: false,
      emailDigests: false,
      customBranding: false,
      hidePoweredBy: false,
      embedWidget: true,
      prioritySupport: false,
      teamMembers: 1,
      apiAccess: false,
    },
    badge: '🆓',
    description: 'Perfect for open-source projects',
    highlighted: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 900, // $9/mo
    priceYearly: 8400, // $84/yr ($7/mo effective)
    stripePriceMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    stripePriceYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
    features: {
      maxProjects: 20,
      privateRepos: true,
      customDomain: true,
      emailDigests: true,
      customBranding: true,
      hidePoweredBy: true,
      embedWidget: true,
      prioritySupport: false,
      teamMembers: 1,
      apiAccess: true,
    },
    badge: '⚡',
    description: 'For serious developers and indie hackers',
    highlighted: true,
  },
  team: {
    id: 'team',
    name: 'Team',
    price: 2900, // $29/mo
    priceYearly: 27600, // $276/yr ($23/mo effective)
    stripePriceMonthly: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID || '',
    stripePriceYearly: process.env.STRIPE_TEAM_YEARLY_PRICE_ID || '',
    features: {
      maxProjects: 100,
      privateRepos: true,
      customDomain: true,
      emailDigests: true,
      customBranding: true,
      hidePoweredBy: true,
      embedWidget: true,
      prioritySupport: true,
      teamMembers: 10,
      apiAccess: true,
    },
    badge: '🏢',
    description: 'For teams shipping together',
    highlighted: false,
  },
};

export function getPlan(planId: PlanId): PlanDefinition {
  return PLANS[planId] || PLANS.free;
}

export function getPlanByStripePriceId(priceId: string): PlanDefinition | undefined {
  return Object.values(PLANS).find(
    p => p.stripePriceMonthly === priceId || p.stripePriceYearly === priceId
  );
}

// Feature gate checks
export function canUsePrivateRepos(plan: PlanId): boolean {
  return getPlan(plan).features.privateRepos;
}

export function canUseCustomDomain(plan: PlanId): boolean {
  return getPlan(plan).features.customDomain;
}

export function canUseEmailDigests(plan: PlanId): boolean {
  return getPlan(plan).features.emailDigests;
}

export function canHidePoweredBy(plan: PlanId): boolean {
  return getPlan(plan).features.hidePoweredBy;
}

export function canUseCustomBranding(plan: PlanId): boolean {
  return getPlan(plan).features.customBranding;
}

export function getMaxProjects(plan: PlanId): number {
  return getPlan(plan).features.maxProjects;
}

export function getMaxTeamMembers(plan: PlanId): number {
  return getPlan(plan).features.teamMembers;
}

export function canUseAnalytics(plan: PlanId): boolean {
  return getPlan(plan).features.apiAccess; // Analytics ships with API access (Pro+)
}
