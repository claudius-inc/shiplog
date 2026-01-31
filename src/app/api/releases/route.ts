// ============================================================================
// Releases API — GET/POST /api/releases
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getProjectById } from '@/lib/db';
import {
  createRelease,
  getProjectReleases,
  getUnassignedEntries,
} from '@/lib/releases';
import { cleanString } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = Number(request.nextUrl.searchParams.get('projectId'));
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const project = await getProjectById(projectId);
    if (!project || project.user_id !== session.userId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const includeUnassigned = request.nextUrl.searchParams.get('unassigned') === '1';

    const releases = await getProjectReleases(projectId);
    const unassigned = includeUnassigned ? await getUnassignedEntries(projectId) : [];

    return NextResponse.json({ releases, unassigned });
  } catch (error) {
    console.error('Releases fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch releases' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, version, title, entryIds } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: 'Missing projectId or title' }, { status: 400 });
    }

    const project = await getProjectById(Number(projectId));
    if (!project || project.user_id !== session.userId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const release = await createRelease({
      project_id: project.id,
      version: version ? cleanString(version, 50) : null,
      title: cleanString(title, 200),
      entry_ids: Array.isArray(entryIds) ? entryIds.map(Number) : undefined,
    });

    return NextResponse.json(release, { status: 201 });
  } catch (error) {
    console.error('Release create error:', error);
    return NextResponse.json({ error: 'Failed to create release' }, { status: 500 });
  }
}
