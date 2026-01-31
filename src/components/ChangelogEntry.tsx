// ============================================================================
// Changelog Entry Component
// ============================================================================

import type { ChangelogEntry as ChangelogEntryType } from '@/lib/types';
import { CategoryBadge } from './CategoryBadge';
import { formatRelativeDate } from '@/lib/changelog';

interface ChangelogEntryProps {
  entry: ChangelogEntryType;
  showDate?: boolean;
}

export function ChangelogEntry({ entry, showDate = true }: ChangelogEntryProps) {
  return (
    <div
      id={`entry-${entry.id}`}
      className="group relative flex gap-4 py-4 px-4 -mx-4 rounded-lg hover:bg-zinc-800/30 transition-colors"
    >
      {/* Emoji indicator */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center text-lg">
        {entry.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-zinc-100 font-medium leading-snug">
              {entry.summary}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <CategoryBadge category={entry.category} />
              <a
                href={entry.pr_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-500 hover:text-brand-400 font-mono transition-colors"
              >
                #{entry.pr_number}
              </a>
              <span className="text-xs text-zinc-600">by</span>
              <span className="text-xs text-zinc-400 font-medium">
                @{entry.pr_author}
              </span>
            </div>
          </div>
          {showDate && (
            <span className="text-xs text-zinc-500 whitespace-nowrap mt-1">
              {formatRelativeDate(entry.pr_merged_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
