// ============================================================================
// Webhook Retry Queue — Dead-letter queue for failed webhook processing
// ============================================================================
//
// When GitHub sends a webhook and our processing fails (AI down, DB error,
// transient issue), we queue the payload for retry instead of losing the PR.
// A cron-triggered endpoint retries failed webhooks with exponential backoff.
// ============================================================================

import { getClient } from './db';

export type WebhookStatus = 'pending' | 'processing' | 'failed' | 'completed' | 'dead';

export interface WebhookQueueItem {
  id: number;
  event_type: string;
  payload: string; // JSON
  status: WebhookStatus;
  attempts: number;
  max_attempts: number;
  next_retry_at: string;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

// Schema
export const WEBHOOK_QUEUE_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS webhook_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'failed', 'completed', 'dead')),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    next_retry_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_webhook_queue_status ON webhook_queue(status);
  CREATE INDEX IF NOT EXISTS idx_webhook_queue_retry ON webhook_queue(next_retry_at);
`;

// Backoff delays in seconds: 30s, 2min, 10min, 1hr, 6hr
const BACKOFF_DELAYS = [30, 120, 600, 3600, 21600];

function getBackoffDelay(attempts: number): number {
  return BACKOFF_DELAYS[Math.min(attempts, BACKOFF_DELAYS.length - 1)];
}

/**
 * Queue a failed webhook for retry.
 */
export async function enqueueWebhook(
  eventType: string,
  payload: object,
  error: string
): Promise<number> {
  const client = getClient();
  const delay = getBackoffDelay(0);
  const nextRetry = new Date(Date.now() + delay * 1000).toISOString();

  const result = await client.execute({
    sql: `INSERT INTO webhook_queue (event_type, payload, status, attempts, next_retry_at, last_error)
          VALUES (?, ?, 'pending', 1, ?, ?)`,
    args: [eventType, JSON.stringify(payload), nextRetry, error],
  });

  return Number(result.lastInsertRowid);
}

/**
 * Get webhooks ready for retry (status=pending/failed, next_retry_at <= now).
 */
export async function getRetryableWebhooks(limit: number = 10): Promise<WebhookQueueItem[]> {
  const client = getClient();
  const now = new Date().toISOString();

  const result = await client.execute({
    sql: `SELECT * FROM webhook_queue
          WHERE status IN ('pending', 'failed') AND next_retry_at <= ?
          ORDER BY next_retry_at ASC
          LIMIT ?`,
    args: [now, limit],
  });

  return result.rows.map((r) => r as unknown as WebhookQueueItem);
}

/**
 * Mark a queued webhook as processing (lock it).
 */
export async function markProcessing(id: number): Promise<boolean> {
  const client = getClient();
  const result = await client.execute({
    sql: `UPDATE webhook_queue SET status = 'processing', updated_at = datetime('now')
          WHERE id = ? AND status IN ('pending', 'failed')`,
    args: [id],
  });
  return (result.rowsAffected ?? 0) > 0;
}

/**
 * Mark a queued webhook as completed (successfully processed).
 */
export async function markCompleted(id: number): Promise<void> {
  const client = getClient();
  await client.execute({
    sql: `UPDATE webhook_queue SET status = 'completed', updated_at = datetime('now') WHERE id = ?`,
    args: [id],
  });
}

/**
 * Mark a queued webhook as failed, schedule next retry or move to dead-letter.
 */
export async function markFailed(id: number, error: string): Promise<void> {
  const client = getClient();

  // Get current state
  const current = await client.execute({
    sql: 'SELECT attempts, max_attempts FROM webhook_queue WHERE id = ?',
    args: [id],
  });

  if (!current.rows[0]) return;

  const row = current.rows[0] as Record<string, unknown>;
  const attempts = Number(row.attempts) + 1;
  const maxAttempts = Number(row.max_attempts);

  if (attempts >= maxAttempts) {
    // Move to dead-letter queue
    await client.execute({
      sql: `UPDATE webhook_queue SET status = 'dead', attempts = ?, last_error = ?, updated_at = datetime('now')
            WHERE id = ?`,
      args: [attempts, error, id],
    });
  } else {
    // Schedule next retry with backoff
    const delay = getBackoffDelay(attempts);
    const nextRetry = new Date(Date.now() + delay * 1000).toISOString();

    await client.execute({
      sql: `UPDATE webhook_queue SET status = 'failed', attempts = ?, next_retry_at = ?, last_error = ?, updated_at = datetime('now')
            WHERE id = ?`,
      args: [attempts, nextRetry, error, id],
    });
  }
}

/**
 * Get queue stats for monitoring.
 */
export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  failed: number;
  dead: number;
  completed: number;
}> {
  const client = getClient();
  const result = await client.execute(
    `SELECT status, COUNT(*) as count FROM webhook_queue GROUP BY status`
  );

  const stats = { pending: 0, processing: 0, failed: 0, dead: 0, completed: 0 };
  for (const row of result.rows) {
    const r = row as Record<string, unknown>;
    const status = String(r.status) as WebhookStatus | 'completed';
    stats[status] = Number(r.count);
  }
  return stats;
}

/**
 * Purge completed items older than N days.
 */
export async function purgeCompleted(olderThanDays: number = 7): Promise<number> {
  const client = getClient();
  const cutoff = new Date(Date.now() - olderThanDays * 86400000).toISOString();
  const result = await client.execute({
    sql: `DELETE FROM webhook_queue WHERE status = 'completed' AND updated_at < ?`,
    args: [cutoff],
  });
  return result.rowsAffected ?? 0;
}
