'use client';

// ============================================================================
// ApiKeyManager — Dashboard component for managing REST API keys
// ============================================================================

import { useState, useEffect } from 'react';

interface ApiKeyInfo {
  id: number;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['read']);
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      if (res.status === 403) {
        setError('API access requires Pro plan or higher');
        setLoading(false);
        return;
      }
      setKeys(data.keys || []);
    } catch {
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }

  async function createKey() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          scopes: newKeyScopes,
          expires_in_days: newKeyExpiry ? Number(newKeyExpiry) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setCreatedKey(data.key);
        setShowCreate(false);
        setNewKeyName('');
        setNewKeyScopes(['read']);
        setNewKeyExpiry('');
        await loadKeys();
      }
    } catch {
      setError('Failed to create key');
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: number) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
    await loadKeys();
  }

  function copyKey() {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return <div className="text-zinc-500 text-sm p-4">Loading API keys...</div>;
  }

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">🔑 API Keys</h3>
          <p className="text-sm text-zinc-400">
            Manage API keys for programmatic access to your changelogs.
          </p>
        </div>
        {!showCreate && !error.includes('Pro plan') && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-500"
          >
            + New Key
          </button>
        )}
      </div>

      {/* Newly created key banner */}
      {createdKey && (
        <div className="mb-4 p-4 bg-amber-900/20 border border-amber-700 rounded-md">
          <p className="text-amber-300 text-sm font-medium mb-2">
            🔐 Your new API key — save it now, it won't be shown again:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-zinc-950 text-emerald-400 px-3 py-2 rounded text-sm font-mono break-all">
              {createdKey}
            </code>
            <button
              onClick={copyKey}
              className="px-3 py-2 bg-zinc-800 text-zinc-300 rounded text-sm hover:bg-zinc-700 shrink-0"
            >
              {copied ? '✅ Copied' : '📋 Copy'}
            </button>
          </div>
          <button
            onClick={() => setCreatedKey(null)}
            className="mt-2 text-xs text-zinc-500 hover:text-zinc-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error state for free tier */}
      {error.includes('Pro plan') && (
        <div className="p-4 bg-zinc-950 rounded-md border border-zinc-800 text-center">
          <p className="text-zinc-400 text-sm">🔒 API access is available on Pro and Team plans.</p>
          <a
            href="/dashboard/billing"
            className="inline-block mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-500"
          >
            Upgrade Plan
          </a>
        </div>
      )}

      {/* Key list */}
      {!error.includes('Pro plan') && (
        <>
          {keys.length === 0 && !showCreate && (
            <p className="text-zinc-500 text-sm">No API keys yet.</p>
          )}

          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3 bg-zinc-950 rounded-md border border-zinc-800"
              >
                <div>
                  <p className="text-sm text-zinc-200 font-medium">{key.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <code className="text-xs text-zinc-500 font-mono">{key.key_prefix}****</code>
                    <span className="text-xs text-zinc-600">
                      Scopes: {key.scopes.join(', ')}
                    </span>
                    {key.last_used_at && (
                      <span className="text-xs text-zinc-600">
                        Last used: {new Date(key.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                    {key.expires_at && (
                      <span className={`text-xs ${
                        new Date(key.expires_at) < new Date() ? 'text-red-400' : 'text-zinc-600'
                      }`}>
                        Expires: {new Date(key.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => revokeKey(key.id)}
                  className="px-2 py-1 text-xs bg-red-900/30 text-red-400 rounded hover:bg-red-900/50"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="mt-4 p-4 bg-zinc-950 rounded-md border border-zinc-800">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g., CI Pipeline)"
                className="w-full bg-zinc-900 text-zinc-200 rounded-md border border-zinc-700 px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 mb-3"
              />

              <div className="flex gap-4 mb-3">
                {(['read', 'write'] as const).map((scope) => (
                  <label key={scope} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newKeyScopes.includes(scope)}
                      onChange={(e) => {
                        if (e.target.checked) setNewKeyScopes([...newKeyScopes, scope]);
                        else setNewKeyScopes(newKeyScopes.filter((s) => s !== scope));
                      }}
                      className="accent-indigo-500"
                    />
                    {scope}
                  </label>
                ))}
              </div>

              <select
                value={newKeyExpiry}
                onChange={(e) => setNewKeyExpiry(e.target.value)}
                className="bg-zinc-900 text-zinc-300 rounded-md border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 mb-3"
              >
                <option value="">No expiry</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
              </select>

              <div className="flex gap-2">
                <button
                  onClick={createKey}
                  disabled={creating || !newKeyName.trim() || newKeyScopes.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Generate Key'}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-md text-sm hover:bg-zinc-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* API docs hint */}
          <div className="mt-4 p-3 bg-zinc-950 rounded-md border border-zinc-800">
            <p className="text-xs text-zinc-500">
              📚 <strong>API Usage:</strong> Include your key as{' '}
              <code className="text-zinc-400">Authorization: Bearer sl_live_...</code> in requests to{' '}
              <code className="text-zinc-400">/api/v1/projects</code> and{' '}
              <code className="text-zinc-400">/api/v1/entries</code>
            </p>
          </div>
        </>
      )}

      {error && !error.includes('Pro plan') && (
        <p className="mt-3 text-sm text-red-400">❌ {error}</p>
      )}
    </div>
  );
}
