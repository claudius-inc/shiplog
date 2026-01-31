// ============================================================================
// GET /api/billing/status — Get current subscription status
// ============================================================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getSubscription } from '@/lib/db';
import { getPlan } from '@/lib/tiers';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sub = await getSubscription(session.userId);
    const planId = sub?.status === 'active' ? sub.plan_id : 'free';
    const plan = getPlan(planId);

    return NextResponse.json({
      plan: {
        id: plan.id,
        name: plan.name,
        badge: plan.badge,
        features: plan.features,
      },
      subscription: sub
        ? {
            status: sub.status,
            currentPeriodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          }
        : null,
    });
  } catch (error) {
    console.error('[billing/status]', error);
    return NextResponse.json({ error: 'Failed to get billing status' }, { status: 500 });
  }
}
