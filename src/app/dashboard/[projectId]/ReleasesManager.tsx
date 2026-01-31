'use client';

// ============================================================================
// Releases Manager — Create, edit, and manage versioned releases
// ============================================================================

import { useState, useEffect } from 'react';

interface ReleaseEntry {
  id: number;
  pr_number: number;
  pr_title: string;
  pr_url: string;
  pr_author: string;
  pr_merged_at: string;
  category: string;
  summary: string;
  emoji: string;
}

interface Release {
  id: number;
  version: string | null;
  title: string;
  published_at: string;
  entry_count: number;
  stats: {
    features: number;
    fixes: number;
    improvements: number;
    breaking: number;
    total: number;
  };
  entries?: ReleaseEntry[];
}

export function ReleasesManager({ projectId }: { projectId: number }) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [unassigned, setUnassigned] = useState<ReleaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedRelease, setExpandedRelease] = useState<number | null>(null);
  const [newVersion, setNewVersion] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchReleases();
  }, [projectId]);

  async function fetchReleases() {
    setLoading(true);
    try {
      const res = await fetch(`/api/releases?projectId=${projectId}&unassigned=1`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setReleases(data.releases || []);
      setUnassigned(data.unassigned || []);
    } catch (err) {
      console.error('Failed to fetch releases:', err);
    } finally {
      setLoading(false);
    }
  }

  async function createRelease() {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch('/api/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          version: newVersion || null,
          title: newTitle,
          entryIds: Array.from(selectedEntries),
        }),
      });
      if (!res.ok) throw new Error('Failed to create release');
      setShowCreate(false);
      setNewVersion('');
      setNewTitle('');
      setSelectedEntries(new Set());
      fetchReleases();
    } catch (err) {
      console.error('Failed to create release:', err);
    }
  }

  async function deleteRelease(releaseId: number) {
    if (!confirm('Delete this release? Entries will be unassigned, not deleted.')) return;
    try {
      await fetch(`/api/releases/${releaseId}`, { method: 'DELETE' });
      fetchReleases();
    } catch (err) {
      console.error('Failed to delete release:', err);
    }
  }

  async function fetchReleaseDetail(releaseId: number) {
    try {
      const res = await fetch(`/api/releases/${releaseId}`);
      if (!res.ok) return;
      const data = await res.json();
      setReleases((prev) =>
        prev.map((r) => (r.id === releaseId ? { ...r, entries: data.entries } : r))
      );
    } catch (err) {
      console.error('Failed to fetch release detail:', err);
    }
  }

  async function copyReleaseNotes(releaseId: number) {
    try {
      const res = await fetch(`/api/releases/${releaseId}?format=markdown`);
      if (!res.ok) return;
      const markdown = await res.text();
      await navigator.clipboard.writeText(markdown);
      alert('Release notes copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy release notes:', err);
    }
  }

  function toggleEntry(id: number) {
    setSelectedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="mt-8 animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-32 mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-100">📦 Releases</h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          {showCreate ? 'Cancel' : '+ New Release'}
        </button>
      </div>

      {/* Create Release Form */}
      {showCreate && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Version (optional)</label>
              <input
                type="text"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="e.g. v1.2.0"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Title *</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. January 2026 Update"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500"
              />
            </div>
          </div>

          {/* Unassigned entries to include */}
          {unassigned.length > 0 && (
            <div>
              <label className="block text-xs text-zinc-400 mb-2">
                Include entries ({selectedEntries.size} selected)
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-zinc-800 rounded p-2">
                {unassigned.map((entry) => (
                  <label
                    key={entry.id}
                    className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEntries.has(entry.id)}
                      onChange={() => toggleEntry(entry.id)}
                      className="accent-indigo-500"
                    />
                    <span className="text-sm">{entry.emoji}</span>
                    <span className="text-sm text-zinc-300 truncate">{entry.summary}</span>
                    <span className="text-xs text-zinc-500 ml-auto">#{entry.pr_number}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={createRelease}
            disabled={!newTitle.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            Create Release
          </button>
        </div>
      )}

      {/* Unassigned count */}
      {unassigned.length > 0 && !showCreate && (
        <div className="text-sm text-zinc-400 bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2">
          📝 {unassigned.length} entries not assigned to any release
        </div>
      )}

      {/* Releases List */}
      {releases.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          No releases yet. Group your changelog entries into versioned releases.
        </div>
      ) : (
        <div className="space-y-3">
          {releases.map((release) => (
            <div
              key={release.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
            >
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors"
                onClick={() => {
                  if (expandedRelease === release.id) {
                    setExpandedRelease(null);
                  } else {
                    setExpandedRelease(release.id);
                    if (!release.entries) fetchReleaseDetail(release.id);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">{expandedRelease === release.id ? '▼' : '▶'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      {release.version && (
                        <span className="px-2 py-0.5 bg-indigo-600/20 text-indigo-300 text-xs rounded-full font-mono">
                          {release.version}
                        </span>
                      )}
                      <span className="text-zinc-100 font-medium">{release.title}</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-zinc-500">
                      <span>{release.entry_count} entries</span>
                      {release.stats.features > 0 && <span>✨ {release.stats.features}</span>}
                      {release.stats.fixes > 0 && <span>🐛 {release.stats.fixes}</span>}
                      {release.stats.improvements > 0 && <span>🔧 {release.stats.improvements}</span>}
                      {release.stats.breaking > 0 && <span>⚠️ {release.stats.breaking}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyReleaseNotes(release.id);
                    }}
                    className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded transition-colors"
                    title="Copy release notes as markdown"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRelease(release.id);
                    }}
                    className="px-2 py-1 text-xs text-red-400 hover:text-red-300 border border-zinc-700 rounded transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Expanded entries */}
              {expandedRelease === release.id && release.entries && (
                <div className="border-t border-zinc-800 p-4 space-y-2">
                  {release.entries.length === 0 ? (
                    <div className="text-sm text-zinc-500">No entries in this release</div>
                  ) : (
                    release.entries.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-2 text-sm">
                        <span className="px-1.5 py-0.5 text-xs rounded bg-zinc-800 text-zinc-400 uppercase">
                          {entry.category}
                        </span>
                        <span>{entry.emoji}</span>
                        <a
                          href={entry.pr_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-300 hover:text-indigo-300 transition-colors truncate"
                        >
                          {entry.summary}
                        </a>
                        <span className="text-zinc-600 ml-auto shrink-0">
                          #{entry.pr_number} by @{entry.pr_author}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
