// ============================================================================
// Connect Repo Button — Client Component
// ============================================================================

'use client';

import { useState } from 'react';

interface RepoInfo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  private: boolean;
  stars: number;
}

interface ConnectRepoButtonProps {
  variant?: 'default' | 'primary';
}

export function ConnectRepoButton({ variant = 'default' }: ConnectRepoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/repos');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRepos(data.repos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repos');
    } finally {
      setLoading(false);
    }
  };

  const connectRepo = async (fullName: string) => {
    setConnecting(fullName);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: fullName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect repo');
      setConnecting(null);
    }
  };

  const openModal = async () => {
    setIsOpen(true);
    await fetchRepos();
  };

  const buttonClass =
    variant === 'primary'
      ? 'px-6 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-all'
      : 'px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-medium border border-zinc-700 hover:bg-zinc-700 transition-all';

  return (
    <>
      <button onClick={openModal} className={buttonClass}>
        + Connect Repo
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal content */}
          <div className="relative glass-card w-full max-w-lg max-h-[70vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Connect a repository</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-xl"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                Select a repo to generate changelogs from
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {repos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => connectRepo(repo.full_name)}
                      disabled={connecting !== null}
                      className="w-full text-left p-4 rounded-lg bg-zinc-800/30 border border-zinc-800 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-200">
                              {repo.name}
                            </span>
                            {repo.private && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] text-zinc-500 bg-zinc-800 border border-zinc-700">
                                Private
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {repo.full_name}
                          </p>
                          {repo.description && (
                            <p className="text-sm text-zinc-400 mt-1 line-clamp-1">
                              {repo.description}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          {connecting === repo.full_name ? (
                            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="text-xs text-brand-400 font-medium">
                              Connect →
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
