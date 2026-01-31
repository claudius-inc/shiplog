// ============================================================================
// POST /api/notifications/test — Send a test notification
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getProjectById, getClient } from '@/lib/db';
import { testNotification, type NotificationProvider } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { config_id, project_id } = await request.json();

    if (!config_id || !project_id) {
      return NextResponse.json({ error: 'config_id and project_id required' }, { status: 400 });
    }

    const project = await getProjectById(Number(project_id));
    if (!project || project.user_id !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Get the notification config
    const result = await getClient().execute({
      sql: 'SELECT * FROM notification_configs WHERE id = ? AND project_id = ?',
      args: [Number(config_id), project.id],
    });

    if (!result.rows[0]) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    const config = result.rows[0] as Record<string, unknown>;
    const ok = await testNotification(
      config.provider as NotificationProvider,
      config.webhook_url as string,
      project.name
    );

    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('[notifications/test] Error:', err);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}
