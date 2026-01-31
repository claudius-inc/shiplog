// ============================================================================
// Releases — Group changelog entries into versioned releases
// ============================================================================
//
// The changelogs table already exists but lacked business logic.
// This module provides release management: create releases, assign entries,
// auto-generate release notes, and query releases with their entries.
// ============================================================================

import { getClient } from './db';
import type { Changelog, ChangelogEntry, ChangelogWithEntries, Category } from './types';

export interface CreateReleaseInput {
  project_id: number;
  version: string | null;
  title: string;
  entry_ids?: number[];
}

export interface ReleaseStats {
  features: number;
  fixes: number;
  improvements: number;
  breaking: number;
  total: number;
}

/**
 * Create a release and optionally assign entries to it.
 */
export async function createRelease(data: CreateReleaseInput): Promise<ChangelogWithEntries> {
  const client = getClient();

  const insertResult = await client.execute({
    sql: 'INSERT INTO changelogs (project_id, version, title) VALUES (?, ?, ?)',
    args: [data.project_id, data.version, data.title],
  });

  const releaseId = Number(insertResult.lastInsertRowid);

  // Assign entries if provided
  if (data.entry_ids && data.entry_ids.length > 0) {
    for (const entryId of data.entry_ids) {
      await client.execute({
        sql: 'UPDATE changelog_entries SET changelog_id = ?, updated_at = datetime(\'now\') WHERE id = ? AND project_id = ?',
        args: [releaseId, entryId, data.project_id],
      });
    }
  }

  return getReleaseWithEntries(releaseId);
}

/**
 * Get a release with its entries.
 */
export async function getReleaseWithEntries(releaseId: number): Promise<ChangelogWithEntries> {
  const client = getClient();

  const releaseResult = await client.execute({
    sql: 'SELECT * FROM changelogs WHERE id = ?',
    args: [releaseId],
  });

  if (!releaseResult.rows[0]) {
    throw new Error(`Release ${releaseId} not found`);
  }

  const release = releaseResult.rows[0] as unknown as Changelog;

  const entriesResult = await client.execute({
    sql: `SELECT * FROM changelog_entries WHERE changelog_id = ? ORDER BY
          CASE category WHEN 'breaking' THEN 0 WHEN 'feature' THEN 1 WHEN 'improvement' THEN 2 WHEN 'fix' THEN 3 END,
          pr_merged_at DESC`,
    args: [releaseId],
  });

  const entries = entriesResult.rows.map((r) => r as unknown as ChangelogEntry);

  return { ...release, entries };
}

/**
 * Get all releases for a project, with entry counts.
 */
export async function getProjectReleases(
  projectId: number,
  options?: { limit?: number; offset?: number }
): Promise<Array<Changelog & { entry_count: number; stats: ReleaseStats }>> {
  const client = getClient();

  let sql = `SELECT c.*, COUNT(ce.id) as entry_count,
             SUM(CASE WHEN ce.category = 'feature' THEN 1 ELSE 0 END) as features,
             SUM(CASE WHEN ce.category = 'fix' THEN 1 ELSE 0 END) as fixes,
             SUM(CASE WHEN ce.category = 'improvement' THEN 1 ELSE 0 END) as improvements,
             SUM(CASE WHEN ce.category = 'breaking' THEN 1 ELSE 0 END) as breaking
             FROM changelogs c
             LEFT JOIN changelog_entries ce ON ce.changelog_id = c.id
             WHERE c.project_id = ?
             GROUP BY c.id
             ORDER BY c.published_at DESC`;

  const args: (number | string)[] = [projectId];

  if (options?.limit) {
    sql += ' LIMIT ?';
    args.push(options.limit);
  }
  if (options?.offset) {
    sql += ' OFFSET ?';
    args.push(options.offset);
  }

  const result = await client.execute({ sql, args });

  return result.rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: Number(row.id),
      project_id: Number(row.project_id),
      version: row.version as string | null,
      title: String(row.title),
      published_at: String(row.published_at),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      entry_count: Number(row.entry_count ?? 0),
      stats: {
        features: Number(row.features ?? 0),
        fixes: Number(row.fixes ?? 0),
        improvements: Number(row.improvements ?? 0),
        breaking: Number(row.breaking ?? 0),
        total: Number(row.entry_count ?? 0),
      },
    };
  });
}

/**
 * Get unassigned entries (not in any release) for a project.
 */
export async function getUnassignedEntries(projectId: number): Promise<ChangelogEntry[]> {
  const client = getClient();
  const result = await client.execute({
    sql: `SELECT * FROM changelog_entries
          WHERE project_id = ? AND changelog_id IS NULL AND is_published = 1
          ORDER BY pr_merged_at DESC`,
    args: [projectId],
  });
  return result.rows.map((r) => r as unknown as ChangelogEntry);
}

/**
 * Assign entries to a release.
 */
export async function assignEntriesToRelease(
  releaseId: number,
  entryIds: number[],
  projectId: number
): Promise<number> {
  const client = getClient();
  let updated = 0;

  for (const entryId of entryIds) {
    const result = await client.execute({
      sql: `UPDATE changelog_entries SET changelog_id = ?, updated_at = datetime('now')
            WHERE id = ? AND project_id = ?`,
      args: [releaseId, entryId, projectId],
    });
    updated += result.rowsAffected ?? 0;
  }

  return updated;
}

/**
 * Remove entries from a release (set changelog_id to NULL).
 */
export async function unassignEntries(entryIds: number[], projectId: number): Promise<number> {
  const client = getClient();
  let updated = 0;

  for (const entryId of entryIds) {
    const result = await client.execute({
      sql: `UPDATE changelog_entries SET changelog_id = NULL, updated_at = datetime('now')
            WHERE id = ? AND project_id = ?`,
      args: [entryId, projectId],
    });
    updated += result.rowsAffected ?? 0;
  }

  return updated;
}

/**
 * Update release metadata.
 */
export async function updateRelease(
  releaseId: number,
  data: { version?: string | null; title?: string }
): Promise<Changelog> {
  const client = getClient();
  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  if (data.version !== undefined) {
    updates.push('version = ?');
    args.push(data.version);
  }
  if (data.title !== undefined) {
    updates.push('title = ?');
    args.push(data.title);
  }

  if (updates.length === 0) {
    const result = await client.execute({
      sql: 'SELECT * FROM changelogs WHERE id = ?',
      args: [releaseId],
    });
    return result.rows[0] as unknown as Changelog;
  }

  updates.push("updated_at = datetime('now')");
  args.push(releaseId);

  await client.execute({
    sql: `UPDATE changelogs SET ${updates.join(', ')} WHERE id = ?`,
    args,
  });

  const result = await client.execute({
    sql: 'SELECT * FROM changelogs WHERE id = ?',
    args: [releaseId],
  });
  return result.rows[0] as unknown as Changelog;
}

/**
 * Delete a release (entries get changelog_id set to NULL via SET NULL FK).
 */
export async function deleteRelease(releaseId: number): Promise<void> {
  const client = getClient();
  await client.execute({
    sql: 'DELETE FROM changelogs WHERE id = ?',
    args: [releaseId],
  });
}

/**
 * Auto-generate release notes markdown from a release's entries.
 */
export async function generateReleaseNotes(releaseId: number): Promise<string> {
  const release = await getReleaseWithEntries(releaseId);
  const lines: string[] = [];

  const header = release.version
    ? `# ${release.title} (${release.version})`
    : `# ${release.title}`;
  lines.push(header);
  lines.push('');

  const groups: Record<Category, ChangelogEntry[]> = {
    breaking: [],
    feature: [],
    improvement: [],
    fix: [],
  };

  for (const entry of release.entries) {
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
