// ============================================================================
// Upgrade Prompt — Shown when user hits a feature gate
// ============================================================================

'use client';

import Link from 'next/link';

interface UpgradePromptProps {
  feature: string;
  description: string;
  requiredPlan?: string;
}

export function UpgradePrompt({ feature, description, requiredPlan = 'Pro' }: UpgradePromptProps) {
  return (
    <div className="rounded-lg border border-indigo-500/20 bg-indigo-950/20 p-6 text-center">
      <div className="text-3xl mb-3">🔒</div>
      <h3 className="text-lg font-semibold text-white mb-2">{feature}</h3>
      <p className="text-sm text-zinc-400 mb-4 max-w-md mx-auto">{description}</p>
      <Link
        href="/dashboard/billing"
        className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Upgrade to {requiredPlan} →
      </Link>
    </div>
  );
}
