// ============================================================================
// /api/v1/entries — Public API: List & create changelog entries
// Requires: Bearer <api_key>
// GET: "read" scope | POST: "write" scope
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, requireScope } from '@/lib/api-auth';
import { getProjectById, getEntriesByProject, getEntryCount, upsertChangelogEntry } from '@/lib/db';
import { cleanString as sanitize } from '@/lib/sanitize';
import type { Category } from '@/lib/types';

const VALID_CATEGORIES: Category[] = ['feature', 'fix', 'improvement', 'breaking'];
const CATEGORY_EMOJI: Record<Category, string> = {
  feature: '✨',
  fix: '🐛',
  improvement: '🔄',
  breaking: '💥',
};

// GET /api/v1/entries?project_id=X&category=Y&limit=Z&offset=W
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid API key via Authorization: Bearer <key>' },
      { status: 401 }
    );
  }

  if (!requireScope(auth, 'read')) {
    return NextResponse.json({ error: 'Insufficient scope. "read" required.' }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const projectId = params.get('project_id');
  if (!projectId) {
    return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
  }

  // Verify ownership
  const project = await getProjectById(Number(projectId));
  if (!project || project.user_id !== auth.userId) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const category = params.get('category') as Category | null;
  const limit = Math.min(Number(params.get('limit') || '50'), 100);
  const offset = Number(params.get('offset') || '0');

  const [entries, total] = await Promise.all([
    getEntriesByProject(project.id, {
      category: category && VALID_CATEGORIES.includes(category) ? category : undefined,
      limit,
      offset,
    }),
    getEntryCount(project.id, category && VALID_CATEGORIES.includes(category) ? category : undefined),
  ]);

  return NextResponse.json({
    data: entries.map(e => ({
      id: e.id,
      pr_number: e.pr_number,
      pr_title: e.pr_title,
      pr_url: e.pr_url,
      pr_author: e.pr_author,
      pr_merged_at: e.pr_merged_at,
      category: e.category,
      summary: e.summary,
      emoji: e.emoji,
      created_at: e.created_at,
    })),
    pagination: {
      total,
      limit,
      offset,
      has_more: offset + limit < total,
    },
  });
}

// POST /api/v1/entries — Create a changelog entry manually
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid API key via Authorization: Bearer <key>' },
      { status: 401 }
    );
  }

  if (!requireScope(auth, 'write')) {
    return NextResponse.json({ error: 'Insufficient scope. "write" required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { project_id, category, summary, pr_number, pr_title, pr_url, pr_author, merged_at } = body;

    if (!project_id || !category || !summary) {
      return NextResponse.json(
        { error: 'project_id, category, and summary are required' },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    const project = await getProjectById(Number(project_id));
    if (!project || project.user_id !== auth.userId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const entry = await upsertChangelogEntry({
      project_id: project.id,
      pr_number: pr_number || -(Date.now() % 1_000_000_000),
      pr_title: sanitize(pr_title || summary).substring(0, 500),
      pr_body: null,
      pr_url: pr_url || '',
      pr_author: sanitize(pr_author || 'api').substring(0, 100),
      pr_author_avatar: null,
      pr_merged_at: merged_at || new Date().toISOString(),
      category: category as Category,
      summary: sanitize(summary).substring(0, 500),
      emoji: CATEGORY_EMOJI[category as Category] || '📝',
    });

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (err) {
    console.error('[api/v1/entries] Create error:', err);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
