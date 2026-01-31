// ============================================================================
// Sync Service — Fetches PRs and categorizes them
// ============================================================================

import { createGitHubClient } from './github';
import { categorizePR } from './ai';
import { upsertChangelogEntry, updateProjectSync, getProjectById, getUserById } from './db';
import type { Project, ChangelogEntry } from './types';

export interface SyncResult {
  project: Project;
  newEntries: number;
  updatedEntries: number;
  errors: string[];
}

export async function syncProject(projectId: number): Promise<SyncResult> {
  const project = getProjectById(projectId);
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  const user = getUserById(project.user_id);
  if (!user) {
    throw new Error(`User ${project.user_id} not found`);
  }

  const github = createGitHubClient(user.access_token);
  const [owner, repo] = project.full_name.split('/');

  const result: SyncResult = {
    project,
    newEntries: 0,
    updatedEntries: 0,
    errors: [],
  };

  try {
    // Fetch merged PRs since last sync
    const prs = await github.getMergedPRs(owner, repo, {
      since: project.last_synced_at || undefined,
      per_page: 100,
    });

    console.log(`Found ${prs.length} merged PRs for ${project.full_name}`);

    // Process each PR
    for (const pr of prs) {
      try {
        // Get diff for better AI categorization
        let diff: string | undefined;
        try {
          diff = await github.getPRDiff(owner, repo, pr.number);
        } catch {
          // Diff fetch is best-effort
        }

        // AI categorization
        const categorization = await categorizePR({
          title: pr.title,
          body: pr.body,
          diff,
        });

        // Upsert the entry
        upsertChangelogEntry({
          project_id: project.id,
          pr_number: pr.number,
          pr_title: pr.title,
          pr_body: pr.body,
          pr_url: pr.html_url,
          pr_author: pr.user.login,
          pr_author_avatar: pr.user.avatar_url,
          pr_merged_at: pr.merged_at!,
          category: categorization.category,
          summary: categorization.summary,
          emoji: categorization.emoji,
        });

        result.newEntries++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`PR #${pr.number}: ${msg}`);
        console.error(`Error processing PR #${pr.number}:`, msg);
      }
    }

    // Update last sync timestamp
    updateProjectSync(projectId);

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Sync failed: ${msg}`);
    console.error(`Sync failed for project ${project.full_name}:`, msg);
  }

  return result;
}

export async function syncProjectFromWebhook(
  repoId: number,
  prData: {
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    user: { login: string; avatar_url: string };
    merged_at: string;
  }
): Promise<ChangelogEntry | null> {
  const { getProjectByWebhookRepoId } = await import('./db');
  const project = getProjectByWebhookRepoId(repoId);
  if (!project) {
    console.log(`No project found for repo ${repoId}`);
    return null;
  }

  const categorization = await categorizePR({
    title: prData.title,
    body: prData.body,
  });

  return upsertChangelogEntry({
    project_id: project.id,
    pr_number: prData.number,
    pr_title: prData.title,
    pr_body: prData.body,
    pr_url: prData.html_url,
    pr_author: prData.user.login,
    pr_author_avatar: prData.user.avatar_url,
    pr_merged_at: prData.merged_at,
    category: categorization.category,
    summary: categorization.summary,
    emoji: categorization.emoji,
  });
}
