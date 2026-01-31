// ============================================================================
// Dashboard Loading State
// ============================================================================

export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-zinc-500">Loading dashboard…</p>
      </div>
    </div>
  );
}
