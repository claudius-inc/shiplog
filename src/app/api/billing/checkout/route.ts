// ============================================================================
// POST /api/billing/checkout — Create Stripe checkout session
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getSubscription } from '@/lib/db';
import { createCheckoutSession } from '@/lib/stripe';
import { PLANS, type PlanId } from '@/lib/tiers';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, interval = 'monthly' } = await request.json();

    // Validate plan
    if (!planId || !PLANS[planId as PlanId] || planId === 'free') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const plan = PLANS[planId as PlanId];
    const priceId = interval === 'yearly' ? plan.stripePriceYearly : plan.stripePriceMonthly;

    if (!priceId) {
      return NextResponse.json({ error: 'Stripe not configured for this plan' }, { status: 500 });
    }

    // Check if user already has a Stripe customer ID
    const existingSub = await getSubscription(session.userId);
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const checkoutSession = await createCheckoutSession({
      userId: session.userId,
      customerId: existingSub?.stripe_customer_id || undefined,
      priceId,
      successUrl: `${origin}/dashboard?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/dashboard?billing=cancelled`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('[billing/checkout]', error);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
