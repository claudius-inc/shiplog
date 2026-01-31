import { describe, it, expect } from 'vitest';
import {
  groupEntriesByDate,
  groupEntriesByCategory,
  generateMarkdown,
  getCategoryLabel,
  getCategoryColor,
  getCategoryIcon,
  formatDate,
  formatRelativeDate,
} from '../changelog';
import type { ChangelogEntry, Category } from '../types';

// ============================================================================
// Test Fixtures
// ============================================================================

function makeEntry(overrides: Partial<ChangelogEntry> = {}): ChangelogEntry {
  return {
    id: 1,
    project_id: 1,
    pr_number: 42,
    pr_title: 'Test PR',
    pr_body: null,
    pr_url: 'https://github.com/test/repo/pull/42',
    pr_author: 'testuser',
    pr_author_avatar: null,
    pr_merged_at: '2026-01-15T12:00:00Z',
    category: 'feature',
    summary: 'Added a test feature',
    emoji: '✨',
    is_published: true,
    created_at: '2026-01-15T12:00:00Z',
    updated_at: '2026-01-15T12:00:00Z',
    ...overrides,
  };
}

const sampleEntries: ChangelogEntry[] = [
  makeEntry({ id: 1, category: 'feature', summary: 'New dashboard', emoji: '✨', pr_merged_at: '2026-01-15T10:00:00Z' }),
  makeEntry({ id: 2, category: 'fix', summary: 'Fix login bug', emoji: '🐛', pr_merged_at: '2026-01-15T14:00:00Z', pr_number: 43 }),
  makeEntry({ id: 3, category: 'feature', summary: 'Add dark mode', emoji: '✨', pr_merged_at: '2026-01-14T08:00:00Z', pr_number: 40 }),
  makeEntry({ id: 4, category: 'breaking', summary: 'Remove v1 API', emoji: '⚠️', pr_merged_at: '2026-01-14T16:00:00Z', pr_number: 41 }),
  makeEntry({ id: 5, category: 'improvement', summary: 'Faster queries', emoji: '💅', pr_merged_at: '2026-01-13T12:00:00Z', pr_number: 39 }),
];

// ============================================================================
// groupEntriesByDate
// ============================================================================

describe('groupEntriesByDate', () => {
  it('groups entries by date', () => {
    const groups = groupEntriesByDate(sampleEntries);
    expect(groups).toHaveLength(3); // Jan 15, 14, 13
  });

  it('sorts groups newest first', () => {
    const groups = groupEntriesByDate(sampleEntries);
    expect(groups[0].date).toBe('2026-01-15');
    expect(groups[1].date).toBe('2026-01-14');
    expect(groups[2].date).toBe('2026-01-13');
  });

  it('puts all same-day entries together', () => {
    const groups = groupEntriesByDate(sampleEntries);
    const jan15 = groups.find(g => g.date === '2026-01-15');
    expect(jan15?.entries).toHaveLength(2);
  });

  it('handles empty array', () => {
    expect(groupEntriesByDate([])).toEqual([]);
  });
});

// ============================================================================
// groupEntriesByCategory
// ============================================================================

describe('groupEntriesByCategory', () => {
  it('groups entries into all 4 categories', () => {
    const groups = groupEntriesByCategory(sampleEntries);
    expect(Object.keys(groups)).toEqual(['breaking', 'feature', 'improvement', 'fix']);
  });

  it('counts entries correctly', () => {
    const groups = groupEntriesByCategory(sampleEntries);
    expect(groups.feature).toHaveLength(2);
    expect(groups.fix).toHaveLength(1);
    expect(groups.breaking).toHaveLength(1);
    expect(groups.improvement).toHaveLength(1);
  });

  it('returns empty arrays for unused categories', () => {
    const featureOnly = [makeEntry({ category: 'feature' })];
    const groups = groupEntriesByCategory(featureOnly);
    expect(groups.fix).toHaveLength(0);
    expect(groups.breaking).toHaveLength(0);
    expect(groups.improvement).toHaveLength(0);
  });
});

// ============================================================================
// generateMarkdown
// ============================================================================

describe('generateMarkdown', () => {
  it('starts with project name header', () => {
    const md = generateMarkdown(sampleEntries, 'TestProject');
    expect(md.startsWith('# TestProject Changelog')).toBe(true);
  });

  it('includes date headers', () => {
    const md = generateMarkdown(sampleEntries, 'Test');
    expect(md).toContain('January 15, 2026');
    expect(md).toContain('January 14, 2026');
  });

  it('includes category headers', () => {
    const md = generateMarkdown(sampleEntries, 'Test');
    expect(md).toContain('🚀 Features');
    expect(md).toContain('🐛 Bug Fixes');
    expect(md).toContain('⚠️ Breaking Changes');
  });

  it('includes PR links', () => {
    const md = generateMarkdown(sampleEntries, 'Test');
    expect(md).toContain('[#42]');
    expect(md).toContain('https://github.com/test/repo/pull/42');
  });

  it('handles empty entries', () => {
    const md = generateMarkdown([], 'Empty');
    expect(md).toBe('# Empty Changelog\n\n');
  });
});

// ============================================================================
// Category Helpers
// ============================================================================

describe('getCategoryLabel', () => {
  it('returns emoji + label for each category', () => {
    expect(getCategoryLabel('feature')).toBe('🚀 Features');
    expect(getCategoryLabel('fix')).toBe('🐛 Bug Fixes');
    expect(getCategoryLabel('improvement')).toBe('💅 Improvements');
    expect(getCategoryLabel('breaking')).toBe('⚠️ Breaking Changes');
  });
});

describe('getCategoryColor', () => {
  it('returns Tailwind classes for each category', () => {
    expect(getCategoryColor('feature')).toContain('emerald');
    expect(getCategoryColor('fix')).toContain('amber');
    expect(getCategoryColor('improvement')).toContain('blue');
    expect(getCategoryColor('breaking')).toContain('red');
  });
});

describe('getCategoryIcon', () => {
  it('returns emoji for each category', () => {
    expect(getCategoryIcon('feature')).toBe('✨');
    expect(getCategoryIcon('fix')).toBe('🐛');
    expect(getCategoryIcon('improvement')).toBe('💅');
    expect(getCategoryIcon('breaking')).toBe('⚠️');
  });
});

// ============================================================================
// Date Formatting
// ============================================================================

describe('formatDate', () => {
  it('formats date string to human-readable', () => {
    const result = formatDate('2026-01-15');
    expect(result).toContain('January');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });
});

describe('formatRelativeDate', () => {
  it('returns "Today" for today', () => {
    const now = new Date().toISOString();
    expect(formatRelativeDate(now)).toBe('Today');
  });

  it('returns "Yesterday" for yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(formatRelativeDate(yesterday)).toBe('Yesterday');
  });

  it('returns "X days ago" for recent dates', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(formatRelativeDate(threeDaysAgo)).toBe('3 days ago');
  });

  it('returns "X weeks ago" for 7-29 days', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    expect(formatRelativeDate(twoWeeksAgo)).toBe('2 weeks ago');
  });

  it('returns "X months ago" for 30-364 days', () => {
    const twoMonthsAgo = new Date(Date.now() - 60 * 86400000).toISOString();
    expect(formatRelativeDate(twoMonthsAgo)).toBe('2 months ago');
  });

  it('returns "X years ago" for 365+ days', () => {
    const twoYearsAgo = new Date(Date.now() - 730 * 86400000).toISOString();
    expect(formatRelativeDate(twoYearsAgo)).toBe('2 years ago');
  });
});
