// ============================================================================
// POST /api/digest/send — Trigger digest send (cron endpoint)
//
// Protected by CRON_SECRET env var. Call from Vercel Cron or external scheduler.
// Body: { projectId?: number } — if omitted, sends for ALL projects with digests enabled.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { sendDigest, getDigestSettings } from '@/lib/digest';
import { getClient } from '@/lib/db';
import { ensureDigestSchema } from '@/lib/digest';

export async function POST(req: NextRequest) {
  // Auth check — must provide CRON_SECRET
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get('host')}`;

  try {
    const body = await req.json().catch(() => ({}));
    const results: Array<{ projectId: number; projectName: string; sent: number; failed: number; skipped: boolean }> = [];

    if (body.projectId) {
      // Send for specific project
      const result = await sendDigest(body.projectId, baseUrl);
      results.push({ projectId: body.projectId, projectName: '', ...result });
    } else {
      // Send for all projects with digests enabled
      await ensureDigestSchema();
      const client = getClient();
      const settingsResult = await client.execute(
        'SELECT ds.*, p.name FROM digest_settings ds JOIN projects p ON p.id = ds.project_id WHERE ds.enabled = 1'
      );

      for (const row of settingsResult.rows) {
        const r = row as Record<string, unknown>;
        const projectId = Number(r.project_id);
        const projectName = r.name as string;

        const result = await sendDigest(projectId, baseUrl);
        results.push({ projectId, projectName, ...result });
      }
    }

    const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

    return NextResponse.json({
      success: true,
      projects: results.length,
      totalSent,
      totalFailed,
      details: results,
    });
  } catch (error: unknown) {
    console.error('Digest send error:', error);
    return NextResponse.json({ error: 'Failed to send digests' }, { status: 500 });
  }
}
