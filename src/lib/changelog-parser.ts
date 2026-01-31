// ============================================================================
// CHANGELOG.md Parser — Import existing changelogs into ShipLog
// Supports "Keep a Changelog" format (https://keepachangelog.com)
// ============================================================================

import type { Category } from './types';

export interface ParsedEntry {
  version: string | null;
  date: string | null;
  category: Category;
  summary: string;
  emoji: string;
}

export interface ParsedChangelog {
  entries: ParsedEntry[];
  warnings: string[];
}

// Map "Keep a Changelog" section headers to ShipLog categories
const SECTION_MAP: Record<string, { category: Category; emoji: string }> = {
  added: { category: 'feature', emoji: '✨' },
  changed: { category: 'improvement', emoji: '🔄' },
  deprecated: { category: 'improvement', emoji: '⚠️' },
  removed: { category: 'breaking', emoji: '🗑️' },
  fixed: { category: 'fix', emoji: '🐛' },
  security: { category: 'fix', emoji: '🔒' },
  // Common alternatives
  'new': { category: 'feature', emoji: '✨' },
  features: { category: 'feature', emoji: '✨' },
  'bug fixes': { category: 'fix', emoji: '🐛' },
  bugfixes: { category: 'fix', emoji: '🐛' },
  fixes: { category: 'fix', emoji: '🐛' },
  improvements: { category: 'improvement', emoji: '🔄' },
  'breaking changes': { category: 'breaking', emoji: '💥' },
  breaking: { category: 'breaking', emoji: '💥' },
  performance: { category: 'improvement', emoji: '⚡' },
  refactor: { category: 'improvement', emoji: '♻️' },
  documentation: { category: 'improvement', emoji: '📝' },
  docs: { category: 'improvement', emoji: '📝' },
};

// Regex patterns
const VERSION_HEADER = /^#{1,2}\s+\[?v?(\d+\.\d+(?:\.\d+)?(?:[-+][^\]\s]+)?)\]?(?:\s*[-–—]\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2}))?/i;
const SECTION_HEADER = /^#{2,3}\s+(.+)/;
const LIST_ITEM = /^\s*[-*+]\s+(.+)/;
const LINK_REF = /^\[.+\]:\s+/;

/**
 * Parse a CHANGELOG.md string into structured entries
 */
export function parseChangelog(markdown: string): ParsedChangelog {
  const lines = markdown.split('\n');
  const entries: ParsedEntry[] = [];
  const warnings: string[] = [];

  let currentVersion: string | null = null;
  let currentDate: string | null = null;
  let currentCategory: { category: Category; emoji: string } | null = null;
  let lineNum = 0;

  for (const line of lines) {
    lineNum++;
    const trimmed = line.trim();

    // Skip empty lines and link references
    if (!trimmed || LINK_REF.test(trimmed)) continue;

    // Check for version header: ## [1.0.0] - 2024-01-15
    const versionMatch = trimmed.match(VERSION_HEADER);
    if (versionMatch) {
      currentVersion = versionMatch[1];
      currentDate = versionMatch[2] ? normalizeDate(versionMatch[2]) : null;
      currentCategory = null;
      continue;
    }

    // Check for section header: ### Added, ### Fixed, etc.
    const sectionMatch = trimmed.match(SECTION_HEADER);
    if (sectionMatch) {
      const sectionName = sectionMatch[1].trim().toLowerCase();
      const mapped = SECTION_MAP[sectionName];
      if (mapped) {
        currentCategory = mapped;
      } else {
        // Try partial match
        const partialMatch = Object.keys(SECTION_MAP).find(k => sectionName.includes(k));
        if (partialMatch) {
          currentCategory = SECTION_MAP[partialMatch];
        } else {
          warnings.push(`Line ${lineNum}: Unknown section "${sectionMatch[1]}" — skipping entries under it`);
          currentCategory = null;
        }
      }
      continue;
    }

    // Check for list item: - Something happened
    const itemMatch = trimmed.match(LIST_ITEM);
    if (itemMatch && currentCategory) {
      const summary = cleanSummary(itemMatch[1]);
      if (summary) {
        entries.push({
          version: currentVersion,
          date: currentDate,
          category: currentCategory.category,
          summary,
          emoji: currentCategory.emoji,
        });
      }
      continue;
    }

    // If it's a list item but no category, try to infer from content
    if (itemMatch && !currentCategory && currentVersion) {
      const summary = cleanSummary(itemMatch[1]);
      if (summary) {
        const inferred = inferCategory(summary);
        entries.push({
          version: currentVersion,
          date: currentDate,
          ...inferred,
          summary,
        });
      }
    }
  }

  if (entries.length === 0) {
    warnings.push('No changelog entries found. Ensure your changelog follows Keep a Changelog format.');
  }

  return { entries, warnings };
}

/**
 * Clean up a summary line
 */
function cleanSummary(raw: string): string {
  return raw
    // Remove PR references like (#123)
    .replace(/\s*\(#\d+\)\s*/g, ' ')
    // Remove markdown links, keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove inline code backticks
    .replace(/`([^`]+)`/g, '$1')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize date string to YYYY-MM-DD
 */
function normalizeDate(dateStr: string): string {
  const cleaned = dateStr.replace(/\//g, '-');
  const parts = cleaned.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return cleaned;
}

/**
 * Infer category from entry text when no section header is available
 */
function inferCategory(text: string): { category: Category; emoji: string } {
  const lower = text.toLowerCase();
  if (/\b(fix\w*|bug\w*|patch\w*|resolve\w*|correct\w*)\b/.test(lower)) {
    return { category: 'fix', emoji: '🐛' };
  }
  if (/\b(break\w*|remov\w*|deprecat\w*|drop\w*)\b/.test(lower)) {
    return { category: 'breaking', emoji: '💥' };
  }
  if (/\b(add\w*|new|introduc\w*|creat\w*|implement\w*)\b/.test(lower)) {
    return { category: 'feature', emoji: '✨' };
  }
  return { category: 'improvement', emoji: '🔄' };
}

/**
 * Parse a GitHub releases-style changelog (different format)
 * Format: ## v1.0.0 followed by bullet points (no section headers)
 */
export function parseGitHubReleases(markdown: string): ParsedChangelog {
  const lines = markdown.split('\n');
  const entries: ParsedEntry[] = [];
  const warnings: string[] = [];

  let currentVersion: string | null = null;
  let currentDate: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const versionMatch = trimmed.match(VERSION_HEADER);
    if (versionMatch) {
      currentVersion = versionMatch[1];
      currentDate = versionMatch[2] ? normalizeDate(versionMatch[2]) : null;
      continue;
    }

    const itemMatch = trimmed.match(LIST_ITEM);
    if (itemMatch && currentVersion) {
      const summary = cleanSummary(itemMatch[1]);
      if (summary) {
        const inferred = inferCategory(summary);
        entries.push({
          version: currentVersion,
          date: currentDate,
          ...inferred,
          summary,
        });
      }
    }
  }

  return { entries, warnings };
}
