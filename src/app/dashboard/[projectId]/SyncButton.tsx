// ============================================================================
// Sync Button — Client Component
// ============================================================================

'use client';

import { useState } from 'react';

interface SyncButtonProps {
  projectId: number;
}

export function SyncButton({ projectId }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    newEntries?: number;
    error?: string;
  } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult({ success: true, newEntries: data.newEntries });
      // Refresh after short delay to show result
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Sync failed',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-all disabled:opacity-50 flex items-center gap-2"
      >
        {syncing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Syncing...
          </>
        ) : (
          <>🔄 Sync Now</>
        )}
      </button>

      {result && (
        <div
          className={`absolute top-full right-0 mt-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
            result.success
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {result.success
            ? `✓ ${result.newEntries} new entries`
            : `✗ ${result.error}`}
        </div>
      )}
    </div>
  );
}
