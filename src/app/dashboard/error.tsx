// ============================================================================
// Dashboard Error Boundary
// ============================================================================

'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-6">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-3">
          Something went wrong
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          There was an error loading this page. This might be a temporary issue.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
