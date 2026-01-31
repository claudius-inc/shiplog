'use client';

// ============================================================================
// Analytics Dashboard Component — Visualizes changelog engagement
// ============================================================================

import { useState, useEffect } from 'react';
import { UpgradePrompt } from '@/components/UpgradePrompt';

interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  widgetViews: number;
  topEntries: Array<{ entry_id: number; pr_title: string; views: number }>;
  viewsByDay: Array<{ date: string; views: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  subscribers: number;
}

export function AnalyticsDashboard({ projectId }: { projectId: number }) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [projectId, days]);

  async function fetchAnalytics() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/${projectId}?days=${days}`);
      if (res.status === 403) {
        setNeedsUpgrade(true);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (needsUpgrade) {
    return (
      <div className="mt-8">
        <UpgradePrompt
          feature="Analytics"
          description="Track page views, widget impressions, popular entries, and referral sources."
          requiredPlan="pro"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-8 animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-32 mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const maxDayViews = Math.max(...data.viewsByDay.map((d) => d.views), 1);

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-100">📊 Analytics</h3>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-300"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Page Views" value={data.totalViews} emoji="👁️" />
        <StatCard label="Unique Visitors" value={data.uniqueVisitors} emoji="👤" />
        <StatCard label="Widget Views" value={data.widgetViews} emoji="🧩" />
        <StatCard label="Subscribers" value={data.subscribers} emoji="📬" />
      </div>

      {/* Views Chart (simple bar chart) */}
      {data.viewsByDay.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-zinc-400 mb-3">Views Over Time</h4>
          <div className="flex items-end gap-1 h-32">
            {data.viewsByDay.map((day) => (
              <div
                key={day.date}
                className="flex-1 bg-indigo-500/70 rounded-t hover:bg-indigo-400/70 transition-colors group relative"
                style={{ height: `${(day.views / maxDayViews) * 100}%`, minHeight: '2px' }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-zinc-700 text-xs text-zinc-200 px-2 py-1 rounded whitespace-nowrap">
                  {day.date}: {day.views}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1 text-xs text-zinc-500">
            <span>{data.viewsByDay[0]?.date}</span>
            <span>{data.viewsByDay[data.viewsByDay.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Top Entries + Referrers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.topEntries.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-zinc-400 mb-3">🔥 Popular Entries</h4>
            <ul className="space-y-2">
              {data.topEntries.map((entry) => (
                <li key={entry.entry_id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300 truncate mr-2">{entry.pr_title}</span>
                  <span className="text-zinc-500 shrink-0">{entry.views} clicks</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.topReferrers.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-zinc-400 mb-3">🔗 Top Referrers</h4>
            <ul className="space-y-2">
              {data.topReferrers.map((ref) => (
                <li key={ref.referrer} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300 truncate mr-2">
                    {(() => {
                      try {
                        return new URL(ref.referrer).hostname;
                      } catch {
                        return ref.referrer;
                      }
                    })()}
                  </span>
                  <span className="text-zinc-500 shrink-0">{ref.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-2xl font-bold text-zinc-100">{value.toLocaleString()}</div>
      <div className="text-sm text-zinc-400">{label}</div>
    </div>
  );
}
