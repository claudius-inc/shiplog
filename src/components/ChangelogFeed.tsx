// ============================================================================
// Changelog Feed — Groups entries by date with filtering
// ============================================================================

'use client';

import { useState } from 'react';
import type { ChangelogEntry as ChangelogEntryType, Category } from '@/lib/types';
import { ChangelogEntry } from './ChangelogEntry';
import { CategoryBadge } from './CategoryBadge';
import { formatDate } from '@/lib/changelog';

interface ChangelogFeedProps {
  entries: ChangelogEntryType[];
  projectName: string;
}

const categories: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'feature', label: 'Features' },
  { value: 'fix', label: 'Fixes' },
  { value: 'improvement', label: 'Improvements' },
  { value: 'breaking', label: 'Breaking' },
];

export function ChangelogFeed({ entries, projectName }: ChangelogFeedProps) {
  const [filter, setFilter] = useState<Category | 'all'>('all');

  const filteredEntries =
    filter === 'all'
      ? entries
      : entries.filter((e) => e.category === filter);

  // Group by date
  const grouped = new Map<string, ChangelogEntryType[]>();
  for (const entry of filteredEntries) {
    const date = entry.pr_merged_at.split('T')[0];
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(entry);
  }

  const sortedDates = Array.from(grouped.keys()).sort((a, b) =>
    b.localeCompare(a)
  );

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              filter === cat.value
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-800 hover:text-zinc-300'
            }`}
          >
            {cat.label}
            <span className="ml-2 text-xs opacity-60">
              {cat.value === 'all'
                ? entries.length
                : entries.filter((e) => e.category === cat.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filteredEntries.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-zinc-400 text-lg">No changelog entries yet</p>
          <p className="text-zinc-500 text-sm mt-2">
            Merged PRs will appear here automatically
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-8">
        {sortedDates.map((date) => (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold text-zinc-200">
                {formatDate(date)}
              </h3>
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-xs text-zinc-500 font-mono">
                {grouped.get(date)!.length} changes
              </span>
            </div>

            {/* Entries */}
            <div className="space-y-1">
              {grouped.get(date)!.map((entry) => (
                <ChangelogEntry
                  key={entry.id}
                  entry={entry}
                  showDate={false}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
