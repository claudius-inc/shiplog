// ============================================================================
// POST /api/billing/portal — Create Stripe customer portal session
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getSubscription } from '@/lib/db';
import { createPortalSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sub = await getSubscription(session.userId);
    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const portalSession = await createPortalSession({
      customerId: sub.stripe_customer_id,
      returnUrl: `${origin}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('[billing/portal]', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
