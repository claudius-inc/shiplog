'use client';

// ============================================================================
// ImportChangelog — Dashboard component for importing CHANGELOG.md files
// ============================================================================

import { useState, useRef } from 'react';

interface ImportResult {
  imported: number;
  skipped: number;
  versions: number;
  warnings: string[];
}

export default function ImportChangelog({ projectId }: { projectId: number }) {
  const [markdown, setMarkdown] = useState('');
  const [format, setFormat] = useState<'keepachangelog' | 'github-releases'>('keepachangelog');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    if (!markdown.trim()) {
      setError('Paste your changelog content or upload a file');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, markdown, format }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Import failed');
      } else {
        setResult(data);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500_000) {
      setError('File too large (max 500KB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMarkdown(reader.result as string);
      setError('');
    };
    reader.readAsText(file);
  }

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
      <h3 className="text-lg font-semibold text-zinc-100 mb-1">📥 Import Changelog</h3>
      <p className="text-sm text-zinc-400 mb-4">
        Import entries from an existing CHANGELOG.md file. Supports{' '}
        <a href="https://keepachangelog.com" target="_blank" rel="noopener" className="text-indigo-400 hover:text-indigo-300">
          Keep a Changelog
        </a>{' '}
        and GitHub Releases formats.
      </p>

      {/* Format selector */}
      <div className="flex gap-3 mb-4">
        <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
          <input
            type="radio"
            name="format"
            checked={format === 'keepachangelog'}
            onChange={() => setFormat('keepachangelog')}
            className="accent-indigo-500"
          />
          Keep a Changelog
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
          <input
            type="radio"
            name="format"
            checked={format === 'github-releases'}
            onChange={() => setFormat('github-releases')}
            className="accent-indigo-500"
          />
          GitHub Releases
        </label>
      </div>

      {/* File upload */}
      <div className="mb-4">
        <input
          ref={fileRef}
          type="file"
          accept=".md,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-md text-sm hover:bg-zinc-700 border border-zinc-700"
        >
          📄 Upload CHANGELOG.md
        </button>
      </div>

      {/* Textarea */}
      <textarea
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        placeholder={`# Changelog\n\n## [1.2.0] - 2024-01-15\n### Added\n- New feature X\n\n### Fixed\n- Bug in Y component`}
        className="w-full h-48 bg-zinc-950 text-zinc-200 rounded-md border border-zinc-700 p-3 text-sm font-mono placeholder-zinc-600 resize-y focus:outline-none focus:border-indigo-500"
      />

      {/* Import button */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleImport}
          disabled={loading || !markdown.trim()}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Importing...' : '📥 Import Entries'}
        </button>
        {markdown && (
          <span className="text-xs text-zinc-500">
            {markdown.length.toLocaleString()} characters
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-md text-sm text-red-300">
          ❌ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4 p-4 bg-emerald-900/20 border border-emerald-800 rounded-md">
          <p className="text-emerald-300 font-medium">
            ✅ Imported {result.imported} entries across {result.versions} version{result.versions !== 1 ? 's' : ''}
          </p>
          {result.skipped > 0 && (
            <p className="text-yellow-400 text-sm mt-1">
              ⚠️ {result.skipped} entries skipped (duplicates or errors)
            </p>
          )}
          {result.warnings && result.warnings.length > 0 && (
            <ul className="mt-2 text-xs text-zinc-400 space-y-1">
              {result.warnings.map((w, i) => (
                <li key={i}>⚠️ {w}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
