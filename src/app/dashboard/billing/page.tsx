// ============================================================================
// /dashboard/billing — Subscription management page
// ============================================================================

import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSession } from '@/lib/session';
import BillingSettings from '../BillingSettings';

export default async function BillingPage() {
  const session = await getSession();
  if (!session) {
    redirect('/api/auth/github');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        {/* Back link */}
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 transition-colors mb-8"
        >
          ← Back to projects
        </a>

        <div className="mb-8">
          <h1 className="text-2xl font-bold">Billing & Plans</h1>
          <p className="text-zinc-400 mt-1">
            Manage your subscription and unlock premium features
          </p>
        </div>

        <BillingSettings />
      </main>

      <Footer />
    </div>
  );
}
