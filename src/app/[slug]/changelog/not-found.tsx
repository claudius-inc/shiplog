// ============================================================================
// Public Changelog — 404
// ============================================================================

import Link from 'next/link';

export default function ChangelogNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-2xl font-bold mb-2">Changelog not found</h1>
        <p className="text-zinc-400 mb-8 max-w-md">
          This project doesn&apos;t exist or its changelog isn&apos;t public yet.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 transition-all"
        >
          Go to ShipLog
        </Link>
      </div>
    </div>
  );
}
