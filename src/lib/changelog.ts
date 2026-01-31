// ============================================================================
// Changelog Generation — Markdown, HTML, RSS
// ============================================================================

import type { ChangelogEntry, Category } from './types';

// ============================================================================
// Grouping
// ============================================================================

interface GroupedEntries {
  date: string;
  entries: ChangelogEntry[];
}

export function groupEntriesByDate(entries: ChangelogEntry[]): GroupedEntries[] {
  const groups = new Map<string, ChangelogEntry[]>();

  for (const entry of entries) {
    const date = entry.pr_merged_at.split('T')[0]; // YYYY-MM-DD
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(entry);
  }

  return Array.from(groups.entries())
    .map(([date, entries]) => ({ date, entries }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function groupEntriesByCategory(
  entries: ChangelogEntry[]
): Record<Category, ChangelogEntry[]> {
  const groups: Record<Category, ChangelogEntry[]> = {
    breaking: [],
    feature: [],
    improvement: [],
    fix: [],
  };

  for (const entry of entries) {
    groups[entry.category].push(entry);
  }

  return groups;
}

// ============================================================================
// Markdown Generation
// ============================================================================

export function generateMarkdown(entries: ChangelogEntry[], projectName: string): string {
  const grouped = groupEntriesByDate(entries);
  let md = `# ${projectName} Changelog\n\n`;

  for (const group of grouped) {
    const formattedDate = formatDate(group.date);
    md += `## ${formattedDate}\n\n`;

    const byCategory = groupEntriesByCategory(group.entries);

    for (const [category, catEntries] of Object.entries(byCategory)) {
      if (catEntries.length === 0) continue;
      md += `### ${getCategoryLabel(category as Category)}\n\n`;

      for (const entry of catEntries) {
        md += `- ${entry.emoji} ${entry.summary}`;
        md += ` ([#${entry.pr_number}](${entry.pr_url}))\n`;
      }

      md += '\n';
    }
  }

  return md;
}

// ============================================================================
// RSS Feed Generation
// ============================================================================

export function generateRSSItems(
  entries: ChangelogEntry[],
  projectSlug: string,
  baseUrl: string
): Array<{
  title: string;
  description: string;
  url: string;
  date: string;
  categories: string[];
}> {
  return entries.map((entry) => ({
    title: `${entry.emoji} ${entry.summary}`,
    description: `<p><strong>${getCategoryLabel(entry.category)}</strong></p>
<p>${entry.summary}</p>
<p><a href="${entry.pr_url}">PR #${entry.pr_number}</a> by @${entry.pr_author}</p>`,
    url: `${baseUrl}/${projectSlug}/changelog#entry-${entry.id}`,
    date: entry.pr_merged_at,
    categories: [entry.category],
  }));
}

// ============================================================================
// Helpers
// ============================================================================

export function getCategoryLabel(category: Category): string {
  const labels: Record<Category, string> = {
    feature: '🚀 Features',
    fix: '🐛 Bug Fixes',
    improvement: '💅 Improvements',
    breaking: '⚠️ Breaking Changes',
  };
  return labels[category];
}

export function getCategoryColor(category: Category): string {
  const colors: Record<Category, string> = {
    feature: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    fix: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    improvement: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    breaking: 'text-red-400 bg-red-400/10 border-red-400/20',
  };
  return colors[category];
}

export function getCategoryIcon(category: Category): string {
  const icons: Record<Category, string> = {
    feature: '✨',
    fix: '🐛',
    improvement: '💅',
    breaking: '⚠️',
  };
  return icons[category];
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
