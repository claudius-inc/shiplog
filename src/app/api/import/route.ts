// ============================================================================
// POST /api/import — Import entries from a CHANGELOG.md file
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getProjectById, upsertChangelogEntry, createChangelog } from '@/lib/db';
import { parseChangelog, parseGitHubReleases } from '@/lib/changelog-parser';
import { cleanString as sanitize } from '@/lib/sanitize';
import type { Category } from '@/lib/types';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { project_id, markdown, format = 'keepachangelog' } = body;

    if (!project_id || !markdown) {
      return NextResponse.json(
        { error: 'project_id and markdown are required' },
        { status: 400 }
      );
    }

    if (typeof markdown !== 'string' || markdown.length > 500_000) {
      return NextResponse.json(
        { error: 'Markdown must be a string under 500KB' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await getProjectById(project_id);
    if (!project || project.user_id !== session.userId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Parse the changelog
    const parsed =
      format === 'github-releases'
        ? parseGitHubReleases(markdown)
        : parseChangelog(markdown);

    if (parsed.entries.length === 0) {
      return NextResponse.json(
        {
          imported: 0,
          skipped: 0,
          warnings: parsed.warnings.length > 0
            ? parsed.warnings
            : ['No entries found. Make sure your changelog follows Keep a Changelog format.'],
        },
        { status: 200 }
      );
    }

    // Group entries by version for changelog creation
    const versionGroups = new Map<string, typeof parsed.entries>();
    for (const entry of parsed.entries) {
      const key = entry.version || 'unreleased';
      if (!versionGroups.has(key)) versionGroups.set(key, []);
      versionGroups.get(key)!.push(entry);
    }

    // Create changelogs for each version and import entries
    let imported = 0;
    let skipped = 0;

    // Process each version group
    for (const [version, entries] of Array.from(versionGroups.entries())) {
      let changelogId: number | null = null;

      // Create a changelog record for this version
      if (version !== 'unreleased') {
        try {
          const changelog = await createChangelog({
            project_id: project.id,
            version,
            title: `v${version}`,
          });
          changelogId = changelog.id;
        } catch {
          // Version might already exist, continue with entries
        }
      }

      // Import each entry as a changelog_entry
      // Since these aren't from PRs, we synthesize PR-like data
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const sanitizedSummary = sanitize(entry.summary);

        try {
          // Use negative PR numbers to distinguish imported entries
          // Each import gets a unique "PR number" based on timestamp + index
          const syntheticPrNumber = -(Date.now() % 1_000_000_000) - i;

          await upsertChangelogEntry({
            project_id: project.id,
            pr_number: syntheticPrNumber,
            pr_title: sanitizedSummary,
            pr_body: null,
            pr_url: '', // No PR URL for imported entries
            pr_author: 'imported',
            pr_author_avatar: null,
            pr_merged_at: entry.date
              ? new Date(entry.date).toISOString()
              : new Date().toISOString(),
            category: entry.category as Category,
            summary: sanitizedSummary,
            emoji: entry.emoji,
          });
          imported++;
        } catch (err) {
          skipped++;
        }
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      versions: versionGroups.size,
      warnings: parsed.warnings,
    });
  } catch (err) {
    console.error('[import] Error:', err);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
