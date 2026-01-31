'use client';

import { useState } from 'react';

interface EmbedCodeProps {
  slug: string;
  projectName: string;
}

export function EmbedCode({ slug, projectName }: EmbedCodeProps) {
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [limit, setLimit] = useState(10);

  const appUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || '';

  const embedHtml = `<div data-shiplog="${slug}" data-theme="${theme}" data-limit="${limit}" data-title="${projectName} Changelog"></div>
<script src="${appUrl}/widget.js" async></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-lg">
          🔌
        </div>
        <div>
          <h2 className="text-lg font-semibold">Embed Widget</h2>
          <p className="text-xs text-zinc-500">Add your changelog to any website</p>
        </div>
      </div>

      {/* Options */}
      <div className="flex gap-4 mb-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Theme</label>
          <div className="flex rounded-lg overflow-hidden border border-zinc-700">
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              Light
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Entries</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Code */}
      <div className="relative">
        <pre className="bg-zinc-900 rounded-lg p-4 text-xs font-mono text-zinc-300 overflow-x-auto border border-zinc-800">
          {embedHtml}
        </pre>
        <button
          onClick={handleCopy}
          className={`absolute top-2 right-2 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-zinc-700 text-zinc-300 border border-zinc-600 hover:bg-zinc-600'
          }`}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      {/* API endpoint note */}
      <p className="text-[11px] text-zinc-600 mt-3">
        JSON API: <code className="text-zinc-500">{appUrl}/api/embed/{slug}</code> — 
        supports <code className="text-zinc-500">?limit=N&category=feature|fix|improvement|breaking</code>
      </p>
    </div>
  );
}
