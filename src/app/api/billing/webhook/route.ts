// ============================================================================
// POST /api/billing/webhook — Stripe webhook handler
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { upsertSubscription, getSubscriptionByStripeSubId } from '@/lib/db';
import { getPlanByStripePriceId, type PlanId } from '@/lib/tiers';
import type Stripe from 'stripe';

// Disable body parsing — Stripe needs raw body
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error('[webhook] Signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`[webhook] ${event.type}`, event.id);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const userId = Number(session.metadata?.shiplog_user_id);
          if (userId) {
            // We'll get the full subscription details in subscription.created/updated
            await upsertSubscription({
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              plan_id: 'pro', // Will be corrected by subscription.updated
              status: 'active',
            });
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = Number(subscription.metadata?.shiplog_user_id);

        if (!userId) {
          console.warn('[webhook] No shiplog_user_id in subscription metadata');
          break;
        }

        // Determine plan from price ID
        const firstItem = subscription.items.data[0];
        const priceId = firstItem?.price?.id;
        const plan = priceId ? getPlanByStripePriceId(priceId) : undefined;
        const planId: PlanId = plan?.id || 'pro';

        // Map Stripe status to our status
        let status = 'active';
        if (['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
          status = 'cancelled';
        } else if (['past_due', 'incomplete'].includes(subscription.status)) {
          status = 'past_due';
        } else if (subscription.status === 'trialing') {
          status = 'trialing';
        }

        // Period dates are on subscription items in newer Stripe API
        const periodStart = firstItem?.current_period_start
          ? new Date(firstItem.current_period_start * 1000).toISOString()
          : undefined;
        const periodEnd = firstItem?.current_period_end
          ? new Date(firstItem.current_period_end * 1000).toISOString()
          : undefined;

        await upsertSubscription({
          user_id: userId,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          plan_id: planId,
          status,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: subscription.cancel_at_period_end,
        });

        console.log(`[webhook] Updated subscription for user ${userId}: ${planId} (${status})`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const existing = await getSubscriptionByStripeSubId(subscription.id);

        if (existing) {
          await upsertSubscription({
            user_id: existing.user_id,
            plan_id: 'free',
            status: 'cancelled',
            cancel_at_period_end: false,
          });
          console.log(`[webhook] Subscription cancelled for user ${existing.user_id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subField = (invoice as unknown as Record<string, unknown>).subscription;
        const subId = typeof subField === 'string' ? subField : (subField as { id?: string })?.id;
        if (subId) {
          const existing = await getSubscriptionByStripeSubId(subId);
          if (existing) {
            await upsertSubscription({
              user_id: existing.user_id,
              plan_id: existing.plan_id,
              status: 'past_due',
            });
            console.log(`[webhook] Payment failed for user ${existing.user_id}`);
          }
        }
        break;
      }

      default:
        console.log(`[webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
