// ============================================================================
// Release Detail API — GET/PATCH/DELETE /api/releases/[releaseId]
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getProjectById } from '@/lib/db';
import {
  getReleaseWithEntries,
  updateRelease,
  deleteRelease,
  assignEntriesToRelease,
  unassignEntries,
  generateReleaseNotes,
} from '@/lib/releases';
import { cleanString } from '@/lib/sanitize';

async function verifyOwnership(releaseId: number, userId: number) {
  const release = await getReleaseWithEntries(releaseId);
  const project = await getProjectById(release.project_id);
  if (!project || project.user_id !== userId) {
    return null;
  }
  return { release, project };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ releaseId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { releaseId } = await params;
    const result = await verifyOwnership(Number(releaseId), session.userId);
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const format = request.nextUrl.searchParams.get('format');
    if (format === 'markdown') {
      const notes = await generateReleaseNotes(Number(releaseId));
      return new Response(notes, {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
      });
    }

    return NextResponse.json(result.release);
  } catch (error) {
    console.error('Release fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch release' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ releaseId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { releaseId } = await params;
    const rid = Number(releaseId);
    const result = await verifyOwnership(rid, session.userId);
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const { version, title, addEntryIds, removeEntryIds } = body;

    // Update metadata
    if (version !== undefined || title !== undefined) {
      await updateRelease(rid, {
        version: version !== undefined ? (version ? cleanString(version, 50) : null) : undefined,
        title: title ? cleanString(title, 200) : undefined,
      });
    }

    // Assign entries
    if (Array.isArray(addEntryIds) && addEntryIds.length > 0) {
      await assignEntriesToRelease(rid, addEntryIds.map(Number), result.project.id);
    }

    // Remove entries
    if (Array.isArray(removeEntryIds) && removeEntryIds.length > 0) {
      await unassignEntries(removeEntryIds.map(Number), result.project.id);
    }

    // Return updated release
    const updated = await getReleaseWithEntries(rid);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Release update error:', error);
    return NextResponse.json({ error: 'Failed to update release' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ releaseId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { releaseId } = await params;
    const result = await verifyOwnership(Number(releaseId), session.userId);
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await deleteRelease(Number(releaseId));
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Release delete error:', error);
    return NextResponse.json({ error: 'Failed to delete release' }, { status: 500 });
  }
}
