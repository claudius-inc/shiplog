// ============================================================================
// Projects API — List and create projects
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createProject, getProjectsByUser, updateProjectSync } from '@/lib/db';
import { createGitHubClient } from '@/lib/github';
import crypto from 'crypto';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projects = await getProjectsByUser(session.userId);
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { repoFullName } = await request.json();
    if (!repoFullName) {
      return NextResponse.json(
        { error: 'repoFullName is required' },
        { status: 400 }
      );
    }

    const [owner, repoName] = repoFullName.split('/');
    const github = createGitHubClient(session.accessToken);
    const repo = await github.getRepo(owner, repoName);

    // Generate unique slug
    const slug = repoName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const project = await createProject({
      user_id: session.userId,
      github_repo_id: repo.id,
      name: repo.name,
      slug: `${owner.toLowerCase()}-${slug}`,
      full_name: repo.full_name,
      description: repo.description,
      default_branch: repo.default_branch,
    });

    // Try to set up webhook
    try {
      const webhookSecret = crypto.randomBytes(32).toString('hex');
      const webhook = await github.createWebhook(
        owner,
        repoName,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`,
        webhookSecret
      );

      await updateProjectSync(project.id, webhook.id, webhookSecret);
    } catch (error) {
      console.warn('Webhook creation failed (will use manual sync):', error);
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create project';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
