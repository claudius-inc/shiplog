'use client';

// ============================================================================
// ChangelogSearch — Search bar for public changelog pages
// ============================================================================

import { useState, useCallback, useRef } from 'react';
import type { ChangelogEntry, Category } from '@/lib/types';

interface SearchResult {
  id: number;
  pr_number: number;
  pr_title: string;
  pr_url: string;
  pr_author: string;
  pr_merged_at: string;
  category: Category;
  summary: string;
  emoji: string;
}

const categoryStyles: Record<string, string> = {
  feature: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  fix: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  improvement: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  breaking: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function ChangelogSearch({ slug }: { slug: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&slug=${slug}`);
        const data = await res.json();
        if (res.ok) {
          setResults(data.entries);
          setHasSearched(true);
        }
      } catch {
        // fail silently
      }
      setSearching(false);
    },
    [slug]
  );

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  function clearSearch() {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  }

  return (
    <div className="mb-8">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          placeholder="Search changelog..."
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-400/50 focus:outline-none transition-colors"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            ✕
          </button>
        )}
        {searching && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="mt-4">
          {results.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl divide-y divide-slate-700/50">
              <div className="px-4 py-2 text-xs text-slate-500">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.map(entry => (
                <a
                  key={entry.id}
                  href={entry.pr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{entry.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 group-hover:text-white transition-colors">
                        {entry.summary}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${categoryStyles[entry.category] || 'text-slate-400 bg-slate-800'}`}>
                          {entry.category}
                        </span>
                        <span className="text-xs text-slate-500">
                          #{entry.pr_number}
                        </span>
                        <span className="text-xs text-slate-600">
                          {new Date(entry.pr_merged_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
