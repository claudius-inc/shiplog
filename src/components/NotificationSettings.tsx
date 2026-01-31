'use client';

// ============================================================================
// NotificationSettings — Dashboard component for Slack/Discord notifications
// ============================================================================

import { useState, useEffect } from 'react';

interface NotifConfig {
  id: number;
  provider: 'slack' | 'discord';
  webhook_url: string;
  enabled: boolean;
  events: string[];
  created_at: string;
}

export default function NotificationSettings({ projectId }: { projectId: number }) {
  const [configs, setConfigs] = useState<NotifConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState<'slack' | 'discord'>('slack');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['new_entry', 'new_release']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState<{ id: number; ok: boolean } | null>(null);

  useEffect(() => {
    loadConfigs();
  }, [projectId]);

  async function loadConfigs() {
    try {
      const res = await fetch(`/api/notifications?project_id=${projectId}`);
      const data = await res.json();
      setConfigs(data.configs || []);
    } catch {
      setError('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }

  async function addConfig() {
    if (!webhookUrl) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, provider, webhook_url: webhookUrl, events }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setShowForm(false);
        setWebhookUrl('');
        await loadConfigs();
      }
    } catch {
      setError('Failed to add notification');
    } finally {
      setSaving(false);
    }
  }

  async function toggleConfig(id: number, enabled: boolean) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, project_id: projectId, enabled }),
    });
    await loadConfigs();
  }

  async function deleteConfig(id: number) {
    await fetch(`/api/notifications?id=${id}&project_id=${projectId}`, { method: 'DELETE' });
    await loadConfigs();
  }

  async function testConfig(id: number) {
    setTestResult(null);
    const res = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config_id: id, project_id: projectId }),
    });
    const data = await res.json();
    setTestResult({ id, ok: data.success });
    setTimeout(() => setTestResult(null), 3000);
  }

  if (loading) {
    return <div className="text-zinc-500 text-sm p-4">Loading notifications...</div>;
  }

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">🔔 Notifications</h3>
          <p className="text-sm text-zinc-400">Get notified in Slack or Discord when your changelog updates.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-500"
          >
            + Add
          </button>
        )}
      </div>

      {/* Existing configs */}
      {configs.length === 0 && !showForm && (
        <p className="text-zinc-500 text-sm">No notifications configured yet.</p>
      )}

      <div className="space-y-3">
        {configs.map((config) => (
          <div
            key={config.id}
            className="flex items-center justify-between p-3 bg-zinc-950 rounded-md border border-zinc-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{config.provider === 'slack' ? '💬' : '🎮'}</span>
              <div>
                <p className="text-sm text-zinc-200 font-medium capitalize">{config.provider}</p>
                <p className="text-xs text-zinc-500">{config.webhook_url}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Events: {config.events.join(', ')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {testResult?.id === config.id && (
                <span className={`text-xs ${testResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {testResult.ok ? '✅ Sent!' : '❌ Failed'}
                </span>
              )}
              <button
                onClick={() => testConfig(config.id)}
                className="px-2 py-1 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700"
                title="Send test message"
              >
                🧪 Test
              </button>
              <button
                onClick={() => toggleConfig(config.id, !config.enabled)}
                className={`px-2 py-1 text-xs rounded ${
                  config.enabled
                    ? 'bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900'
                    : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                }`}
              >
                {config.enabled ? '● On' : '○ Off'}
              </button>
              <button
                onClick={() => deleteConfig(config.id)}
                className="px-2 py-1 text-xs bg-red-900/30 text-red-400 rounded hover:bg-red-900/50"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mt-4 p-4 bg-zinc-950 rounded-md border border-zinc-800">
          <div className="flex gap-3 mb-3">
            <button
              onClick={() => setProvider('slack')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                provider === 'slack'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              💬 Slack
            </button>
            <button
              onClick={() => setProvider('discord')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                provider === 'discord'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              🎮 Discord
            </button>
          </div>

          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder={
              provider === 'slack'
                ? 'https://hooks.slack.com/services/...'
                : 'https://discord.com/api/webhooks/...'
            }
            className="w-full bg-zinc-900 text-zinc-200 rounded-md border border-zinc-700 px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
          />

          <div className="flex gap-4 mt-3">
            {(['new_entry', 'new_release'] as const).map((evt) => (
              <label key={evt} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={events.includes(evt)}
                  onChange={(e) => {
                    if (e.target.checked) setEvents([...events, evt]);
                    else setEvents(events.filter((v) => v !== evt));
                  }}
                  className="accent-indigo-500"
                />
                {evt === 'new_entry' ? 'New entries' : 'New releases'}
              </label>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={addConfig}
              disabled={saving || !webhookUrl}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(''); }}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-md text-sm hover:bg-zinc-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-400">❌ {error}</p>
      )}
    </div>
  );
}
