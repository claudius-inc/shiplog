// ============================================================================
// Releases Tests — Release notes generation, stats, etc.
// ============================================================================

import { describe, it, expect } from 'vitest';
import type { Category } from '../types';

// Test the release notes generation logic (extracted for testability)
function generateReleaseNotesFromEntries(
  title: string,
  version: string | null,
  entries: Array<{ category: Category; emoji: string; summary: string; pr_number: number; pr_url: string; pr_author: string }>
): string {
  const lines: string[] = [];

  const header = version ? `# ${title} (${version})` : `# ${title}`;
  lines.push(header);
  lines.push('');

  const groups: Record<Category, typeof entries> = {
    breaking: [],
    feature: [],
    improvement: [],
    fix: [],
  };

  for (const entry of entries) {
    groups[entry.category].push(entry);
  }

  const sectionLabels: Record<Category, string> = {
    breaking: '⚠️ Breaking Changes',
    feature: '✨ Features',
    improvement: '🔧 Improvements',
    fix: '🐛 Bug Fixes',
  };

  for (const cat of ['breaking', 'feature', 'improvement', 'fix'] as Category[]) {
    if (groups[cat].length === 0) continue;
    lines.push(`## ${sectionLabels[cat]}`);
    lines.push('');
    for (const entry of groups[cat]) {
      lines.push(`- ${entry.emoji} ${entry.summary} ([#${entry.pr_number}](${entry.pr_url})) — @${entry.pr_author}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

describe('Release Notes Generation', () => {
  const sampleEntries = [
    { category: 'feature' as Category, emoji: '✨', summary: 'Add dark mode', pr_number: 42, pr_url: 'https://github.com/test/repo/pull/42', pr_author: 'alice' },
    { category: 'fix' as Category, emoji: '🐛', summary: 'Fix login crash', pr_number: 43, pr_url: 'https://github.com/test/repo/pull/43', pr_author: 'bob' },
    { category: 'breaking' as Category, emoji: '⚠️', summary: 'Remove legacy API', pr_number: 44, pr_url: 'https://github.com/test/repo/pull/44', pr_author: 'charlie' },
    { category: 'improvement' as Category, emoji: '🔧', summary: 'Faster page loads', pr_number: 45, pr_url: 'https://github.com/test/repo/pull/45', pr_author: 'alice' },
  ];

  it('should generate markdown with version', () => {
    const notes = generateReleaseNotesFromEntries('January Update', 'v1.2.0', sampleEntries);
    expect(notes).toContain('# January Update (v1.2.0)');
  });

  it('should generate markdown without version', () => {
    const notes = generateReleaseNotesFromEntries('January Update', null, sampleEntries);
    expect(notes).toContain('# January Update');
    expect(notes).not.toContain('(null)');
  });

  it('should group entries by category', () => {
    const notes = generateReleaseNotesFromEntries('Release', 'v1.0', sampleEntries);
    expect(notes).toContain('## ⚠️ Breaking Changes');
    expect(notes).toContain('## ✨ Features');
    expect(notes).toContain('## 🔧 Improvements');
    expect(notes).toContain('## 🐛 Bug Fixes');
  });

  it('should order: breaking → features → improvements → fixes', () => {
    const notes = generateReleaseNotesFromEntries('Release', 'v1.0', sampleEntries);
    const breakingIdx = notes.indexOf('Breaking Changes');
    const featureIdx = notes.indexOf('Features');
    const improvementIdx = notes.indexOf('Improvements');
    const fixIdx = notes.indexOf('Bug Fixes');
    expect(breakingIdx).toBeLessThan(featureIdx);
    expect(featureIdx).toBeLessThan(improvementIdx);
    expect(improvementIdx).toBeLessThan(fixIdx);
  });

  it('should include PR links and authors', () => {
    const notes = generateReleaseNotesFromEntries('Release', 'v1.0', sampleEntries);
    expect(notes).toContain('[#42](https://github.com/test/repo/pull/42)');
    expect(notes).toContain('@alice');
    expect(notes).toContain('@bob');
  });

  it('should skip empty categories', () => {
    const onlyFeatures = sampleEntries.filter(e => e.category === 'feature');
    const notes = generateReleaseNotesFromEntries('Release', 'v1.0', onlyFeatures);
    expect(notes).toContain('## ✨ Features');
    expect(notes).not.toContain('## ⚠️ Breaking Changes');
    expect(notes).not.toContain('## 🐛 Bug Fixes');
  });

  it('should handle empty entries', () => {
    const notes = generateReleaseNotesFromEntries('Empty Release', 'v0.0.1', []);
    expect(notes).toContain('# Empty Release (v0.0.1)');
    expect(notes).not.toContain('##');
  });
});

describe('Release Stats', () => {
  function computeStats(entries: Array<{ category: Category }>): {
    features: number;
    fixes: number;
    improvements: number;
    breaking: number;
    total: number;
  } {
    const stats = { features: 0, fixes: 0, improvements: 0, breaking: 0, total: entries.length };
    for (const entry of entries) {
      switch (entry.category) {
        case 'feature': stats.features++; break;
        case 'fix': stats.fixes++; break;
        case 'improvement': stats.improvements++; break;
        case 'breaking': stats.breaking++; break;
      }
    }
    return stats;
  }

  it('should count categories correctly', () => {
    const entries = [
      { category: 'feature' as Category },
      { category: 'feature' as Category },
      { category: 'fix' as Category },
      { category: 'breaking' as Category },
    ];
    const stats = computeStats(entries);
    expect(stats.features).toBe(2);
    expect(stats.fixes).toBe(1);
    expect(stats.breaking).toBe(1);
    expect(stats.improvements).toBe(0);
    expect(stats.total).toBe(4);
  });

  it('should handle empty entries', () => {
    const stats = computeStats([]);
    expect(stats.total).toBe(0);
    expect(stats.features).toBe(0);
  });
});
