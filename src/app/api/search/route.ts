// ============================================================================
// GET /api/search?q=...&slug=... — Search changelog entries
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/db';
import { getProjectBySlug } from '@/lib/db';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim();
  const slug = req.nextUrl.searchParams.get('slug');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10), 50);

  if (!query || !slug) {
    return NextResponse.json({ error: 'Query (q) and slug are required' }, { status: 400 });
  }

  const project = await getProjectBySlug(slug);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const client = getClient();

  // Search across summary, pr_title, and pr_body
  const searchTerm = `%${query}%`;
  const result = await client.execute({
    sql: `SELECT id, pr_number, pr_title, pr_url, pr_author, pr_author_avatar, pr_merged_at,
                 category, summary, emoji
          FROM changelog_entries
          WHERE project_id = ?
            AND is_published = 1
            AND (summary LIKE ? OR pr_title LIKE ? OR pr_body LIKE ?)
          ORDER BY pr_merged_at DESC
          LIMIT ?`,
    args: [project.id, searchTerm, searchTerm, searchTerm, limit],
  });

  return NextResponse.json({
    query,
    count: result.rows.length,
    entries: result.rows,
  });
}
