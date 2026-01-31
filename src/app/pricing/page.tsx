// ============================================================================
// /pricing — Public pricing page
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Simple, transparent pricing for ShipLog. Start free with up to 2 repos. Upgrade to Pro or Team for private repos, custom branding, and more.',
  openGraph: {
    title: 'ShipLog Pricing — Start Free',
    description:
      'Simple, transparent pricing. Free for open-source. Pro at $9/mo. Team at $29/mo.',
  },
};

const PLANS = [
  {
    name: 'Free',
    badge: '🆓',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Perfect for open-source projects',
    features: [
      { text: 'Up to 2 public repos', included: true },
      { text: 'AI-powered changelog generation', included: true },
      { text: 'Embeddable widget', included: true },
      { text: 'RSS feed', included: true },
      { text: 'Private repos', included: false },
      { text: 'Custom domain', included: false },
      { text: 'Email digests', included: false },
      { text: 'Custom branding', included: false },
    ],
    cta: 'Get Started',
    ctaHref: '/api/auth/github',
    highlighted: false,
  },
  {
    name: 'Pro',
    badge: '⚡',
    monthlyPrice: 9,
    yearlyPrice: 7,
    description: 'For serious developers and indie hackers',
    features: [
      { text: 'Up to 20 repos', included: true },
      { text: 'Private repository support', included: true },
      { text: 'Custom domain mapping', included: true },
      { text: 'Email digest notifications', included: true },
      { text: 'Custom branding & colors', included: true },
      { text: 'Remove "Powered by" badge', included: true },
      { text: 'Full API access', included: true },
      { text: 'Priority support', included: false },
    ],
    cta: 'Start Free Trial',
    ctaHref: '/api/auth/github',
    highlighted: true,
  },
  {
    name: 'Team',
    badge: '🏢',
    monthlyPrice: 29,
    yearlyPrice: 23,
    description: 'For teams shipping together',
    features: [
      { text: 'Up to 100 repos', included: true },
      { text: 'Everything in Pro', included: true },
      { text: 'Up to 10 team members', included: true },
      { text: 'Priority support', included: true },
      { text: 'Team role management', included: true },
      { text: 'SSO (coming soon)', included: true },
      { text: 'Dedicated success manager', included: false },
      { text: 'Custom integrations', included: false },
    ],
    cta: 'Start Free Trial',
    ctaHref: '/api/auth/github',
    highlighted: false,
  },
];

const FAQS = [
  {
    q: 'Can I try Pro features for free?',
    a: 'Yes! We offer a 14-day free trial on all paid plans. No credit card required to start.',
  },
  {
    q: 'What happens if I downgrade?',
    a: 'Your existing changelogs stay published. Private repo syncing stops, and premium features are disabled at the end of your billing period.',
  },
  {
    q: 'Can I change plans anytime?',
    a: 'Absolutely. Upgrade or downgrade at any time. When upgrading, you pay the prorated difference. When downgrading, the change takes effect at the end of your billing period.',
  },
  {
    q: 'Do you offer refunds?',
    a: "If you're not satisfied within the first 30 days, we'll issue a full refund. No questions asked.",
  },
  {
    q: 'Is my data safe?',
    a: 'We only read your PR titles, descriptions, and labels. We never access your source code. All data is encrypted at rest and in transit.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Start free. Upgrade when you need more. No surprises.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-8 flex flex-col ${
                plan.highlighted
                  ? 'border-indigo-500/50 bg-zinc-900/80 ring-1 ring-indigo-500/20 relative'
                  : 'border-zinc-800 bg-zinc-900'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <span className="text-3xl">{plan.badge}</span>
                <h3 className="text-xl font-bold text-white mt-2">{plan.name}</h3>
                <p className="text-sm text-zinc-400 mt-1">{plan.description}</p>
              </div>

              <div className="text-center mb-8">
                <span className="text-4xl font-bold text-white">
                  ${plan.monthlyPrice}
                </span>
                <span className="text-zinc-400">/month</span>
                {plan.yearlyPrice > 0 && plan.yearlyPrice !== plan.monthlyPrice && (
                  <p className="text-sm text-emerald-400 mt-1">
                    ${plan.yearlyPrice}/mo billed yearly
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((f, i) => (
                  <li
                    key={i}
                    className={`flex items-start gap-2 text-sm ${
                      f.included ? 'text-zinc-300' : 'text-zinc-600'
                    }`}
                  >
                    <span className={f.included ? 'text-emerald-400' : 'text-zinc-700'}>
                      {f.included ? '✓' : '✗'}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`block text-center py-3 px-6 rounded-lg font-medium transition-colors ${
                  plan.highlighted
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {FAQS.map((faq, i) => (
              <div key={i} className="border-b border-zinc-800 pb-6">
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-zinc-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <h2 className="text-2xl font-bold mb-4">Ready to ship better changelogs?</h2>
          <p className="text-zinc-400 mb-6">
            Join developers who let ShipLog write their release notes.
          </p>
          <Link
            href="/api/auth/github"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Get Started for Free →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
