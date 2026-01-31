// ============================================================================
// Global 404 Page
// ============================================================================

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-7xl font-bold text-zinc-800 mb-4">404</div>
        <h1 className="text-2xl font-bold mb-3">Page not found</h1>
        <p className="text-zinc-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-3 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-medium transition-colors"
          >
            View pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
