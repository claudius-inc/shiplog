'use client';

import { useState, useEffect } from 'react';

// ============================================================================
// Billing Settings — Dashboard subscription management
// ============================================================================

interface BillingData {
  plan: {
    id: string;
    name: string;
    badge: string;
    features: {
      maxProjects: number;
      privateRepos: boolean;
      customDomain: boolean;
      emailDigests: boolean;
      customBranding: boolean;
      hidePoweredBy: boolean;
      embedWidget: boolean;
      prioritySupport: boolean;
      teamMembers: number;
      apiAccess: boolean;
    };
  };
  subscription: {
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

const PLAN_CARDS = [
  {
    id: 'free',
    name: 'Free',
    badge: '🆓',
    price: '$0',
    period: 'forever',
    features: ['2 public repos', 'Embed widget', 'AI changelogs'],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: '⚡',
    price: '$9',
    period: '/month',
    yearlyPrice: '$7/mo billed yearly',
    features: [
      '20 repos (public + private)',
      'Custom domain',
      'Email digests',
      'Custom branding',
      'Remove "Powered by" badge',
      'API access',
    ],
    highlighted: true,
  },
  {
    id: 'team',
    name: 'Team',
    badge: '🏢',
    price: '$29',
    period: '/month',
    yearlyPrice: '$23/mo billed yearly',
    features: [
      '100 repos',
      'Everything in Pro',
      'Up to 10 team members',
      'Priority support',
    ],
  },
];

export default function BillingSettings() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetch('/api/billing/status')
      .then(r => r.json())
      .then(data => {
        setBilling(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpgrade = async (planId: string) => {
    setCheckoutLoading(planId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, interval }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Portal error:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-zinc-800 rounded w-1/3" />
          <div className="h-4 bg-zinc-800 rounded w-2/3" />
        </div>
      </div>
    );
  }

  const currentPlan = billing?.plan?.id || 'free';

  return (
    <div className="space-y-6">
      {/* Current Plan Banner */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              {billing?.plan?.badge} Current Plan: {billing?.plan?.name || 'Free'}
            </h3>
            {billing?.subscription && (
              <p className="text-sm text-zinc-400 mt-1">
                {billing.subscription.cancelAtPeriodEnd ? (
                  <span className="text-amber-400">
                    ⚠️ Cancels at end of period ({new Date(billing.subscription.currentPeriodEnd).toLocaleDateString()})
                  </span>
                ) : (
                  <>Renews {new Date(billing.subscription.currentPeriodEnd).toLocaleDateString()}</>
                )}
              </p>
            )}
          </div>
          {billing?.subscription?.status === 'active' && currentPlan !== 'free' && (
            <button
              onClick={handleManageBilling}
              className="px-4 py-2 text-sm bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* Interval Toggle */}
      <div className="flex justify-center">
        <div className="bg-zinc-900 rounded-lg p-1 inline-flex border border-zinc-800">
          <button
            onClick={() => setInterval('monthly')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              interval === 'monthly'
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('yearly')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              interval === 'yearly'
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs text-emerald-400">Save 22%</span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLAN_CARDS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isDowngrade = (currentPlan === 'team' && plan.id === 'pro') ||
            (currentPlan !== 'free' && plan.id === 'free');

          return (
            <div
              key={plan.id}
              className={`rounded-lg border p-6 ${
                plan.highlighted
                  ? 'border-indigo-500/50 bg-zinc-900/80 ring-1 ring-indigo-500/20'
                  : 'border-zinc-800 bg-zinc-900'
              } ${isCurrent ? 'ring-2 ring-emerald-500/30' : ''}`}
            >
              <div className="text-center mb-4">
                <span className="text-2xl">{plan.badge}</span>
                <h4 className="text-lg font-bold text-white mt-1">{plan.name}</h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-white">
                    {interval === 'yearly' && plan.yearlyPrice
                      ? plan.yearlyPrice.split(' ')[0]
                      : plan.price}
                  </span>
                  <span className="text-zinc-400 text-sm">
                    {interval === 'yearly' && plan.yearlyPrice
                      ? '/mo billed yearly'
                      : plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-2 mb-6 min-h-[140px]">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button
                  disabled
                  className="w-full py-2 px-4 bg-zinc-800 text-zinc-500 rounded-lg text-sm cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : isDowngrade ? (
                <button
                  onClick={handleManageBilling}
                  className="w-full py-2 px-4 bg-zinc-800 text-zinc-300 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
                >
                  Manage Plan
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={!!checkoutLoading}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    plan.highlighted
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  } disabled:opacity-50`}
                >
                  {checkoutLoading === plan.id ? 'Redirecting...' : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
