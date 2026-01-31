// ============================================================================
// Billing Utilities — Feature gates & enforcement
// ============================================================================

import { getUserPlan, getProjectsByUser } from './db';
import { getPlan, getMaxProjects, canUsePrivateRepos, type PlanId } from './tiers';

export interface BillingCheck {
  allowed: boolean;
  reason?: string;
  currentPlan: PlanId;
  requiredPlan?: PlanId;
}

// Check if user can create another project
export async function canCreateProject(userId: number): Promise<BillingCheck> {
  const plan = await getUserPlan(userId);
  const projects = await getProjectsByUser(userId);
  const max = getMaxProjects(plan);

  if (projects.length >= max) {
    return {
      allowed: false,
      reason: `You've reached the ${max}-project limit on the ${getPlan(plan).name} plan. Upgrade to add more.`,
      currentPlan: plan,
      requiredPlan: plan === 'free' ? 'pro' : 'team',
    };
  }

  return { allowed: true, currentPlan: plan };
}

// Check if user can connect a private repo
export async function canConnectPrivateRepo(userId: number): Promise<BillingCheck> {
  const plan = await getUserPlan(userId);

  if (!canUsePrivateRepos(plan)) {
    return {
      allowed: false,
      reason: 'Private repos require a Pro or Team plan.',
      currentPlan: plan,
      requiredPlan: 'pro',
    };
  }

  return { allowed: true, currentPlan: plan };
}

// Check feature access by name
export async function checkFeatureAccess(
  userId: number,
  feature: keyof ReturnType<typeof getPlan>['features']
): Promise<BillingCheck> {
  const plan = await getUserPlan(userId);
  const planDef = getPlan(plan);
  const hasAccess = Boolean(planDef.features[feature]);

  if (!hasAccess) {
    const featureNames: Record<string, string> = {
      privateRepos: 'Private repos',
      customDomain: 'Custom domains',
      emailDigests: 'Email digests',
      customBranding: 'Custom branding',
      hidePoweredBy: 'Removing "Powered by" badge',
      prioritySupport: 'Priority support',
      apiAccess: 'API access',
    };

    return {
      allowed: false,
      reason: `${featureNames[feature] || feature} requires an upgrade.`,
      currentPlan: plan,
      requiredPlan: 'pro',
    };
  }

  return { allowed: true, currentPlan: plan };
}
