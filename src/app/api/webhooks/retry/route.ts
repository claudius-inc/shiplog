// ============================================================================
// Webhook Retry Endpoint — POST /api/webhooks/retry
// ============================================================================
// Processes queued failed webhooks with exponential backoff.
// Designed to be called by a cron job (e.g., every 5 minutes).
// Protected by CRON_SECRET env var.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  getRetryableWebhooks,
  markProcessing,
  markCompleted,
  markFailed,
  getQueueStats,
  purgeCompleted,
} from '@/lib/webhook-queue';
import { syncProjectFromWebhook } from '@/lib/sync';
import { getProjectByWebhookRepoId } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (prevents unauthorized triggering)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const retryable = await getRetryableWebhooks(10);

    if (retryable.length === 0) {
      return NextResponse.json({ message: 'No webhooks to retry', processed: 0 });
    }

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (const item of retryable) {
      // Lock the item
      const locked = await markProcessing(item.id);
      if (!locked) continue;

      processed++;

      try {
        const payload = JSON.parse(item.payload);
        const pr = payload.pull_request;
        const repoId = payload.repository?.id;

        if (!repoId || !pr) {
          await markFailed(item.id, 'Invalid payload: missing repo ID or PR data');
          failed++;
          continue;
        }

        // Verify project still exists
        const project = await getProjectByWebhookRepoId(repoId);
        if (!project) {
          await markFailed(item.id, `No project found for repo ${repoId}`);
          failed++;
          continue;
        }

        // Retry the sync
        const entry = await syncProjectFromWebhook(repoId, {
          number: pr.number,
          title: pr.title,
          body: pr.body,
          html_url: pr.html_url,
          user: {
            login: pr.user.login,
            avatar_url: pr.user.avatar_url,
          },
          merged_at: pr.merged_at,
        });

        await markCompleted(item.id);
        succeeded++;
        console.log(`Webhook retry succeeded: item ${item.id}, entry ${entry?.id}`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        await markFailed(item.id, msg);
        failed++;
        console.error(`Webhook retry failed: item ${item.id}:`, msg);
      }
    }

    // Purge old completed items
    const purged = await purgeCompleted(7);

    // Return queue stats
    const stats = await getQueueStats();

    return NextResponse.json({
      processed,
      succeeded,
      failed,
      purged,
      queueStats: stats,
    });
  } catch (error) {
    console.error('Webhook retry error:', error);
    return NextResponse.json({ error: 'Retry processing failed' }, { status: 500 });
  }
}
