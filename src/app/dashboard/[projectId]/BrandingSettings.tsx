'use client';

// ============================================================================
// Branding Settings — Color pickers, logo URL, live preview
// ============================================================================

import { useState, useCallback } from 'react';
import type { BrandingConfig } from '@/lib/types';
import { DEFAULT_BRANDING } from '@/lib/types';

interface BrandingSettingsProps {
  projectId: number;
  projectName: string;
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border border-zinc-700 bg-transparent"
      />
      <div className="flex-1 min-w-0">
        <label className="text-xs text-zinc-400 block">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) {
              onChange(e.target.value);
            }
          }}
          className="mt-0.5 w-24 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-zinc-500"
          maxLength={7}
        />
      </div>
    </div>
  );
}

export default function BrandingSettings({ projectId, projectName }: BrandingSettingsProps) {
  const [branding, setBranding] = useState<BrandingConfig>({ ...DEFAULT_BRANDING });
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState(false);

  const loadBranding = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/branding?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setBranding(data.branding);
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [projectId, loaded]);

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadBranding();
  };

  const update = (field: keyof BrandingConfig, value: string | boolean | null) => {
    setBranding((prev) => ({ ...prev, [field]: value }));
    setMessage('');
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, branding }),
      });
      if (res.ok) {
        setMessage('Branding saved ✓');
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.error}`);
      }
    } catch {
      setMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    setBranding({ ...DEFAULT_BRANDING });
    setMessage('Reset to defaults — save to apply');
  };

  return (
    <div className="glass-card p-6 mt-8">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🎨 Custom Branding
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Customize colors, logo, and appearance for your public changelog
          </p>
        </div>
        <span className="text-zinc-500 text-xl">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div className="mt-6 space-y-6">
          {loading ? (
            <div className="text-sm text-zinc-500 py-4">Loading branding settings...</div>
          ) : (
            <>
              {/* Logo URL */}
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={branding.logo_url || ''}
                  onChange={(e) => update('logo_url', e.target.value || null)}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
                <p className="text-xs text-zinc-600 mt-1">
                  Recommended: square image, at least 64×64px. Displayed in changelog header.
                </p>
              </div>

              {/* Color Grid */}
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-3">
                  Colors
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <ColorField
                    label="Primary"
                    value={branding.primary_color}
                    onChange={(v) => update('primary_color', v)}
                  />
                  <ColorField
                    label="Accent"
                    value={branding.accent_color}
                    onChange={(v) => update('accent_color', v)}
                  />
                  <ColorField
                    label="Header BG"
                    value={branding.header_bg}
                    onChange={(v) => update('header_bg', v)}
                  />
                  <ColorField
                    label="Page BG"
                    value={branding.page_bg}
                    onChange={(v) => update('page_bg', v)}
                  />
                  <ColorField
                    label="Text"
                    value={branding.text_color}
                    onChange={(v) => update('text_color', v)}
                  />
                </div>
              </div>

              {/* Hide Powered By */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hide-powered-by"
                  checked={branding.hide_powered_by}
                  onChange={(e) => update('hide_powered_by', e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <label htmlFor="hide-powered-by" className="text-sm text-zinc-400">
                  Hide &quot;Powered by ShipLog&quot; footer
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    Pro
                  </span>
                </label>
              </div>

              {/* Live Preview */}
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-3">
                  Preview
                </label>
                <div
                  className="rounded-xl border border-zinc-700 overflow-hidden"
                  style={{ background: branding.page_bg }}
                >
                  {/* Preview Header */}
                  <div
                    className="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-3"
                    style={{ background: branding.header_bg }}
                  >
                    {branding.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={branding.logo_url}
                        alt="Logo"
                        className="w-6 h-6 rounded object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <span
                      className="text-sm font-semibold"
                      style={{ color: branding.text_color }}
                    >
                      {projectName}
                    </span>
                  </div>

                  {/* Preview Content */}
                  <div className="p-4 space-y-2">
                    <h3
                      className="text-lg font-bold"
                      style={{ color: branding.text_color }}
                    >
                      Changelog
                    </h3>

                    {/* Fake entry */}
                    <div
                      className="rounded-lg p-3 border"
                      style={{
                        background: `${branding.primary_color}08`,
                        borderColor: `${branding.primary_color}20`,
                      }}
                    >
                      <p className="text-sm" style={{ color: branding.text_color }}>
                        ✨ New feature added
                      </p>
                      <span
                        className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          color: branding.primary_color,
                          background: `${branding.primary_color}15`,
                          border: `1px solid ${branding.primary_color}30`,
                        }}
                      >
                        Feature
                      </span>
                    </div>

                    <div
                      className="rounded-lg p-3 border"
                      style={{
                        background: `${branding.accent_color}08`,
                        borderColor: `${branding.accent_color}20`,
                      }}
                    >
                      <p className="text-sm" style={{ color: branding.text_color }}>
                        🐛 Bug fix applied
                      </p>
                      <span
                        className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          color: branding.accent_color,
                          background: `${branding.accent_color}15`,
                          border: `1px solid ${branding.accent_color}30`,
                        }}
                      >
                        Fix
                      </span>
                    </div>

                    {/* Powered by */}
                    {!branding.hide_powered_by && (
                      <p className="text-xs pt-2 opacity-40" style={{ color: branding.text_color }}>
                        Changelog powered by ShipLog
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-all"
                >
                  {saving ? 'Saving...' : 'Save Branding'}
                </button>
                <button
                  onClick={resetDefaults}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium border border-zinc-700 hover:bg-zinc-700 transition-all"
                >
                  Reset Defaults
                </button>
                {message && (
                  <span className={`text-sm ${message.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                    {message}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
