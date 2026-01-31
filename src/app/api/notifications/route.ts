// ============================================================================
// /api/notifications — CRUD for Slack/Discord notification configs
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getProjectById, getClient } from '@/lib/db';
import {
  type NotificationConfig,
  type NotificationProvider,
  NOTIFICATION_EVENTS,
  testNotification,
  NOTIFICATIONS_SCHEMA_SQL,
} from '@/lib/notifications';
import { cleanString as sanitize } from '@/lib/sanitize';

// Ensure notification tables exist
let _schemaInit = false;
async function ensureNotifSchema() {
  if (_schemaInit) return;
  const client = getClient();
  const stmts = NOTIFICATIONS_SCHEMA_SQL.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of stmts) {
    await client.execute(stmt + ';');
  }
  _schemaInit = true;
}

// GET — List notification configs for a project
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get('project_id');
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 });

  const project = await getProjectById(Number(projectId));
  if (!project || project.user_id !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await ensureNotifSchema();
  const result = await getClient().execute({
    sql: 'SELECT * FROM notification_configs WHERE project_id = ? ORDER BY created_at DESC',
    args: [project.id],
  });

  const configs = result.rows.map(r => ({
    id: r.id,
    project_id: r.project_id,
    provider: r.provider,
    webhook_url: maskUrl(r.webhook_url as string),
    enabled: Boolean(r.enabled),
    events: JSON.parse((r.events as string) || '[]'),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  return NextResponse.json({ configs });
}

// POST — Create a new notification config
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { project_id, provider, webhook_url, events } = body;

    if (!project_id || !provider || !webhook_url) {
      return NextResponse.json({ error: 'project_id, provider, webhook_url required' }, { status: 400 });
    }

    // Validate provider
    if (!['slack', 'discord'].includes(provider)) {
      return NextResponse.json({ error: 'Provider must be slack or discord' }, { status: 400 });
    }

    // Validate webhook URL
    if (!isValidWebhookUrl(provider, webhook_url)) {
      return NextResponse.json({ error: `Invalid ${provider} webhook URL` }, { status: 400 });
    }

    const project = await getProjectById(Number(project_id));
    if (!project || project.user_id !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Validate events
    const validEvents = (events || NOTIFICATION_EVENTS).filter(
      (e: string) => (NOTIFICATION_EVENTS as readonly string[]).includes(e)
    );

    await ensureNotifSchema();

    // Limit: max 5 configs per project
    const countResult = await getClient().execute({
      sql: 'SELECT COUNT(*) as count FROM notification_configs WHERE project_id = ?',
      args: [project.id],
    });
    if (Number((countResult.rows[0] as Record<string, unknown>).count) >= 5) {
      return NextResponse.json({ error: 'Max 5 notification configs per project' }, { status: 400 });
    }

    const insertResult = await getClient().execute({
      sql: `INSERT INTO notification_configs (project_id, provider, webhook_url, events)
            VALUES (?, ?, ?, ?)`,
      args: [project.id, provider, webhook_url, JSON.stringify(validEvents)],
    });

    return NextResponse.json({
      id: Number(insertResult.lastInsertRowid),
      provider,
      events: validEvents,
      message: 'Notification config created',
    });
  } catch (err) {
    console.error('[notifications] Create error:', err);
    return NextResponse.json({ error: 'Failed to create config' }, { status: 500 });
  }
}

// DELETE — Remove a notification config
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const configId = request.nextUrl.searchParams.get('id');
  const projectId = request.nextUrl.searchParams.get('project_id');
  if (!configId || !projectId) {
    return NextResponse.json({ error: 'id and project_id required' }, { status: 400 });
  }

  const project = await getProjectById(Number(projectId));
  if (!project || project.user_id !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await ensureNotifSchema();
  await getClient().execute({
    sql: 'DELETE FROM notification_configs WHERE id = ? AND project_id = ?',
    args: [Number(configId), project.id],
  });

  return NextResponse.json({ deleted: true });
}

// PATCH — Toggle enabled / update events
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, project_id, enabled, events } = body;

    if (!id || !project_id) {
      return NextResponse.json({ error: 'id and project_id required' }, { status: 400 });
    }

    const project = await getProjectById(Number(project_id));
    if (!project || project.user_id !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await ensureNotifSchema();

    const updates: string[] = [];
    const args: (string | number)[] = [];

    if (typeof enabled === 'boolean') {
      updates.push('enabled = ?');
      args.push(enabled ? 1 : 0);
    }

    if (Array.isArray(events)) {
      const validEvents = events.filter(
        (e: string) => (NOTIFICATION_EVENTS as readonly string[]).includes(e)
      );
      updates.push('events = ?');
      args.push(JSON.stringify(validEvents));
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    updates.push("updated_at = datetime('now')");
    args.push(Number(id), project.id);

    await getClient().execute({
      sql: `UPDATE notification_configs SET ${updates.join(', ')} WHERE id = ? AND project_id = ?`,
      args,
    });

    return NextResponse.json({ updated: true });
  } catch (err) {
    console.error('[notifications] Update error:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// ============================================================================
// Helpers
// ============================================================================

function isValidWebhookUrl(provider: string, url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (provider === 'slack') {
      return parsed.hostname === 'hooks.slack.com';
    }
    if (provider === 'discord') {
      return parsed.hostname === 'discord.com' && parsed.pathname.includes('/webhooks/');
    }
    return false;
  } catch {
    return false;
  }
}

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/');
    if (pathParts.length > 2) {
      // Keep first segment, mask the rest
      const masked = pathParts.map((p, i) =>
        i <= 2 || !p ? p : p.substring(0, 4) + '****'
      );
      return `${parsed.origin}${masked.join('/')}`;
    }
    return `${parsed.origin}/****`;
  } catch {
    return '****';
  }
}
