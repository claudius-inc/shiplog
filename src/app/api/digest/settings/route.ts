// ============================================================================
// GET/PUT /api/digest/settings — Manage digest settings for a project
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDigestSettings, upsertDigestSettings, getSubscriberCount } from '@/lib/digest';
import { getSession } from '@/lib/session';
import { getProjectById } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = parseInt(req.nextUrl.searchParams.get('projectId') ?? '', 10);
  if (isNaN(projectId)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  const project = await getProjectById(projectId);
  if (!project || project.user_id !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const settings = await getDigestSettings(projectId);
  const subscriberCount = await getSubscriberCount(projectId);

  return NextResponse.json({ settings, subscriberCount });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { projectId, enabled, frequency, dayOfWeek, sendHourUtc } = body;

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
  }

  const project = await getProjectById(projectId);
  if (!project || project.user_id !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const settings = await upsertDigestSettings({
    project_id: projectId,
    enabled: !!enabled,
    frequency: frequency ?? 'weekly',
    day_of_week: dayOfWeek ?? 1,
    send_hour_utc: sendHourUtc ?? 9,
  });

  return NextResponse.json({ success: true, settings });
}
