// ============================================================================
// GET /api/v1/projects — Public API: List user's projects
// Requires: Bearer <api_key> with "read" scope
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, requireScope } from '@/lib/api-auth';
import { getProjectsByUser } from '@/lib/db';

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

  const projects = await getProjectsByUser(auth.userId);

  return NextResponse.json({
    data: projects.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      full_name: p.full_name,
      description: p.description,
      is_public: Boolean(p.is_public),
      last_synced_at: p.last_synced_at,
      created_at: p.created_at,
    })),
  });
}
