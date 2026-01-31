// ============================================================================
// List GitHub repos for the authenticated user
// ============================================================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createGitHubClient } from '@/lib/github';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const github = createGitHubClient(session.accessToken);
    const repos = await github.listRepos({ sort: 'updated', per_page: 50 });

    return NextResponse.json({
      repos: repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        language: repo.language,
        private: repo.private,
        stars: repo.stargazers_count,
        updated_at: repo.updated_at,
      })),
    });
  } catch (error) {
    console.error('List repos error:', error);
    return NextResponse.json({ error: 'Failed to fetch repos' }, { status: 500 });
  }
}
