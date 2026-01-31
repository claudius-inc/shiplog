// ============================================================================
// Digest System — Subscriber management + digest generation
// ============================================================================

import { getClient } from './db';
import { getEntriesByProject, getProjectById, getProjectBySlug } from './db';
import { renderDigestEmail, renderWelcomeEmail, type DigestData } from './email-template';
import type { Project } from './types';
import { randomBytes, createHash } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface Subscriber {
  id: number;
  project_id: number;
  email: string;
  token: string; // unsubscribe token
  frequency: 'weekly' | 'daily';
  confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DigestSettings {
  project_id: number;
  enabled: boolean;
  frequency: 'weekly' | 'daily';
  day_of_week: number; // 0=Sun, 1=Mon, ..., 6=Sat (for weekly)
  send_hour_utc: number; // 0-23
  last_sent_at: string | null;
}

// ============================================================================
// Schema — call once at startup
// ============================================================================

const DIGEST_SCHEMA = `
  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    frequency TEXT NOT NULL DEFAULT 'weekly' CHECK(frequency IN ('weekly', 'daily')),
    confirmed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(project_id, email)
  );

  CREATE TABLE IF NOT EXISTS digest_settings (
    project_id INTEGER PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    enabled INTEGER NOT NULL DEFAULT 0,
    frequency TEXT NOT NULL DEFAULT 'weekly' CHECK(frequency IN ('weekly', 'daily')),
    day_of_week INTEGER NOT NULL DEFAULT 1,
    send_hour_utc INTEGER NOT NULL DEFAULT 9,
    last_sent_at TEXT,
    UNIQUE(project_id)
  );
`;

const DIGEST_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_subscribers_project ON subscribers(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email)',
  'CREATE INDEX IF NOT EXISTS idx_subscribers_token ON subscribers(token)',
];

let _digestSchemaReady = false;

export async function ensureDigestSchema(): Promise<void> {
  if (_digestSchemaReady) return;
  const client = getClient();
  const stmts = DIGEST_SCHEMA.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of stmts) {
    await client.execute(stmt + ';');
  }
  for (const idx of DIGEST_INDEXES) {
    await client.execute(idx);
  }
  _digestSchemaReady = true;
}

// ============================================================================
// Token Generation
// ============================================================================

function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

// ============================================================================
// Subscriber Operations
// ============================================================================

export async function subscribe(projectId: number, email: string, frequency: 'weekly' | 'daily' = 'weekly'): Promise<Subscriber> {
  await ensureDigestSchema();
  const client = getClient();
  const normalizedEmail = email.toLowerCase().trim();
  const token = generateToken();

  await client.execute({
    sql: `INSERT INTO subscribers (project_id, email, token, frequency, confirmed)
          VALUES (?, ?, ?, ?, 1)
          ON CONFLICT(project_id, email) DO UPDATE SET
            frequency = excluded.frequency,
            updated_at = datetime('now')`,
    args: [projectId, normalizedEmail, token, frequency],
  });

  const result = await client.execute({
    sql: 'SELECT * FROM subscribers WHERE project_id = ? AND email = ?',
    args: [projectId, normalizedEmail],
  });
  return result.rows[0] as unknown as Subscriber;
}

export async function unsubscribe(token: string): Promise<{ success: boolean; projectName?: string }> {
  await ensureDigestSchema();
  const client = getClient();

  const result = await client.execute({
    sql: `SELECT s.*, p.name as project_name FROM subscribers s
          JOIN projects p ON p.id = s.project_id
          WHERE s.token = ?`,
    args: [token],
  });

  if (!result.rows[0]) {
    return { success: false };
  }

  const projectName = (result.rows[0] as Record<string, unknown>).project_name as string;

  await client.execute({
    sql: 'DELETE FROM subscribers WHERE token = ?',
    args: [token],
  });

  return { success: true, projectName };
}

export async function getSubscribers(projectId: number): Promise<Subscriber[]> {
  await ensureDigestSchema();
  const result = await getClient().execute({
    sql: 'SELECT * FROM subscribers WHERE project_id = ? AND confirmed = 1 ORDER BY created_at',
    args: [projectId],
  });
  return result.rows as unknown as Subscriber[];
}

export async function getSubscriberCount(projectId: number): Promise<number> {
  await ensureDigestSchema();
  const result = await getClient().execute({
    sql: 'SELECT COUNT(*) as count FROM subscribers WHERE project_id = ? AND confirmed = 1',
    args: [projectId],
  });
  return Number((result.rows[0] as Record<string, unknown>).count);
}

// ============================================================================
// Digest Settings
// ============================================================================

export async function getDigestSettings(projectId: number): Promise<DigestSettings | null> {
  await ensureDigestSchema();
  const result = await getClient().execute({
    sql: 'SELECT * FROM digest_settings WHERE project_id = ?',
    args: [projectId],
  });
  return result.rows[0] ? (result.rows[0] as unknown as DigestSettings) : null;
}

export async function upsertDigestSettings(settings: Partial<DigestSettings> & { project_id: number }): Promise<DigestSettings> {
  await ensureDigestSchema();
  const client = getClient();

  await client.execute({
    sql: `INSERT INTO digest_settings (project_id, enabled, frequency, day_of_week, send_hour_utc)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(project_id) DO UPDATE SET
            enabled = COALESCE(excluded.enabled, digest_settings.enabled),
            frequency = COALESCE(excluded.frequency, digest_settings.frequency),
            day_of_week = COALESCE(excluded.day_of_week, digest_settings.day_of_week),
            send_hour_utc = COALESCE(excluded.send_hour_utc, digest_settings.send_hour_utc)`,
    args: [
      settings.project_id,
      settings.enabled ? 1 : 0,
      settings.frequency ?? 'weekly',
      settings.day_of_week ?? 1,
      settings.send_hour_utc ?? 9,
    ],
  });

  const result = await client.execute({
    sql: 'SELECT * FROM digest_settings WHERE project_id = ?',
    args: [settings.project_id],
  });
  return result.rows[0] as unknown as DigestSettings;
}

export async function markDigestSent(projectId: number): Promise<void> {
  await ensureDigestSchema();
  await getClient().execute({
    sql: `UPDATE digest_settings SET last_sent_at = datetime('now') WHERE project_id = ?`,
    args: [projectId],
  });
}

// ============================================================================
// Digest Generation
// ============================================================================

export async function generateDigest(
  projectId: number,
  baseUrl: string,
  options?: { days?: number }
): Promise<{ html: string; text: string; subject: string; recipientCount: number } | null> {
  const project = await getProjectById(projectId);
  if (!project) return null;

  const settings = await getDigestSettings(projectId);
  const days = options?.days ?? (settings?.frequency === 'daily' ? 1 : 7);

  // Get entries from the last N days
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  const allEntries = await getEntriesByProject(projectId, { limit: 100 });
  const recentEntries = allEntries.filter(e => e.pr_merged_at >= sinceStr);

  if (recentEntries.length === 0) return null;

  const subscribers = await getSubscribers(projectId);
  if (subscribers.length === 0) return null;

  const now = new Date();
  const digestData: DigestData = {
    project: { name: project.name, slug: project.slug },
    entries: recentEntries,
    period: { from: sinceStr.split('T')[0], to: now.toISOString().split('T')[0] },
    baseUrl,
    unsubscribeUrl: `${baseUrl}/api/digest/unsubscribe?token=__TOKEN__`,
  };

  const rendered = renderDigestEmail(digestData);
  return { ...rendered, recipientCount: subscribers.length };
}

// ============================================================================
// Email Provider Interface
// ============================================================================

export interface EmailProvider {
  send(to: string, subject: string, html: string, text: string): Promise<boolean>;
}

/**
 * Console provider — logs emails to stdout (for development)
 */
export class ConsoleEmailProvider implements EmailProvider {
  async send(to: string, subject: string, _html: string, text: string): Promise<boolean> {
    console.log(`[EMAIL] To: ${to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Body:\n${text}\n---`);
    return true;
  }
}

/**
 * Webhook provider — POSTs email data to a URL (for integrations)
 */
export class WebhookEmailProvider implements EmailProvider {
  constructor(private webhookUrl: string, private secret?: string) {}

  async send(to: string, subject: string, html: string, text: string): Promise<boolean> {
    const body = JSON.stringify({ to, subject, html, text });
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.secret) {
      const sig = createHash('sha256').update(body + this.secret).digest('hex');
      headers['X-Signature'] = sig;
    }

    const response = await fetch(this.webhookUrl, { method: 'POST', headers, body });
    return response.ok;
  }
}

/**
 * Resend provider — uses Resend API (most popular for Next.js apps)
 */
export class ResendEmailProvider implements EmailProvider {
  constructor(
    private apiKey: string,
    private from: string = 'ShipLog <digest@shiplog.dev>'
  ) {}

  async send(to: string, subject: string, html: string, text: string): Promise<boolean> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.from, to, subject, html, text }),
    });
    return response.ok;
  }
}

/**
 * Get configured email provider
 */
export function getEmailProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY) {
    return new ResendEmailProvider(
      process.env.RESEND_API_KEY,
      process.env.EMAIL_FROM ?? 'ShipLog <digest@shiplog.dev>'
    );
  }
  if (process.env.EMAIL_WEBHOOK_URL) {
    return new WebhookEmailProvider(process.env.EMAIL_WEBHOOK_URL, process.env.EMAIL_WEBHOOK_SECRET);
  }
  return new ConsoleEmailProvider();
}

// ============================================================================
// Send Digest to All Subscribers
// ============================================================================

export async function sendDigest(
  projectId: number,
  baseUrl: string,
  options?: { days?: number; provider?: EmailProvider }
): Promise<{ sent: number; failed: number; skipped: boolean }> {
  const project = await getProjectById(projectId);
  if (!project) return { sent: 0, failed: 0, skipped: true };

  const settings = await getDigestSettings(projectId);
  const days = options?.days ?? (settings?.frequency === 'daily' ? 1 : 7);

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  const allEntries = await getEntriesByProject(projectId, { limit: 100 });
  const recentEntries = allEntries.filter(e => e.pr_merged_at >= sinceStr);

  if (recentEntries.length === 0) return { sent: 0, failed: 0, skipped: true };

  const subscribers = await getSubscribers(projectId);
  if (subscribers.length === 0) return { sent: 0, failed: 0, skipped: true };

  const provider = options?.provider ?? getEmailProvider();
  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    const digestData: DigestData = {
      project: { name: project.name, slug: project.slug },
      entries: recentEntries,
      period: { from: sinceStr.split('T')[0], to: new Date().toISOString().split('T')[0] },
      baseUrl,
      unsubscribeUrl: `${baseUrl}/api/digest/unsubscribe?token=${sub.token}`,
    };

    const { html, text, subject } = renderDigestEmail(digestData);

    try {
      const ok = await provider.send(sub.email, subject, html, text);
      if (ok) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }

  await markDigestSent(projectId);
  return { sent, failed, skipped: false };
}
