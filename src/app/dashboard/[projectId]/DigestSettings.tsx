'use client';

// ============================================================================
// DigestSettings — Dashboard component for managing email digests
// ============================================================================

import { useState, useEffect } from 'react';

interface DigestState {
  enabled: boolean;
  frequency: 'weekly' | 'daily';
  dayOfWeek: number;
  sendHourUtc: number;
  subscriberCount: number;
  lastSentAt: string | null;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DigestSettings({ projectId }: { projectId: number }) {
  const [state, setState] = useState<DigestState>({
    enabled: false,
    frequency: 'weekly',
    dayOfWeek: 1,
    sendHourUtc: 9,
    subscriberCount: 0,
    lastSentAt: null,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetch(`/api/digest/settings?projectId=${projectId}`)
      .then(r => r.json())
      .then(data => {
        if (data.settings) {
          setState(s => ({
            ...s,
            enabled: !!data.settings.enabled,
            frequency: data.settings.frequency || 'weekly',
            dayOfWeek: data.settings.day_of_week ?? 1,
            sendHourUtc: data.settings.send_hour_utc ?? 9,
            subscriberCount: data.subscriberCount ?? 0,
            lastSentAt: data.settings.last_sent_at,
          }));
        }
      })
      .catch(() => {});
  }, [projectId]);

  async function save() {
    setSaving(true);
    try {
      await fetch('/api/digest/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          enabled: state.enabled,
          frequency: state.frequency,
          dayOfWeek: state.dayOfWeek,
          sendHourUtc: state.sendHourUtc,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Save failed:', e);
    }
    setSaving(false);
  }

  return (
    <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            📬 Email Digests
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Send periodic changelog summaries to subscribers
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={state.enabled}
            onChange={e => setState(s => ({ ...s, enabled: e.target.checked }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
        </label>
      </div>

      {state.enabled && (
        <div className="space-y-4">
          {/* Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Frequency
              </label>
              <select
                value={state.frequency}
                onChange={e => setState(s => ({ ...s, frequency: e.target.value as 'weekly' | 'daily' }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:border-indigo-400 focus:outline-none"
              >
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>

            {state.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Day
                </label>
                <select
                  value={state.dayOfWeek}
                  onChange={e => setState(s => ({ ...s, dayOfWeek: Number(e.target.value) }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:border-indigo-400 focus:outline-none"
                >
                  {DAYS.map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Time (UTC)
              </label>
              <select
                value={state.sendHourUtc}
                onChange={e => setState(s => ({ ...s, sendHourUtc: Number(e.target.value) }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:border-indigo-400 focus:outline-none"
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 py-3 text-sm">
            <span className="text-slate-400">
              <span className="text-slate-200 font-medium">{state.subscriberCount}</span> subscriber{state.subscriberCount !== 1 ? 's' : ''}
            </span>
            {state.lastSentAt && (
              <span className="text-slate-400">
                Last sent: <span className="text-slate-300">{new Date(state.lastSentAt).toLocaleDateString()}</span>
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Settings'}
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors"
            >
              Preview Email
            </button>
          </div>

          {/* Preview iframe */}
          {showPreview && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">Email Preview</span>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-slate-400 hover:text-slate-200 text-sm"
                >
                  Close ✕
                </button>
              </div>
              <iframe
                src={`/api/digest/preview/${projectId}?days=${state.frequency === 'daily' ? 1 : 7}`}
                className="w-full h-[600px] bg-slate-900 rounded-lg border border-slate-700"
                title="Digest preview"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
