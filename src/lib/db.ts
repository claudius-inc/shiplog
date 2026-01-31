// ============================================================================
// Database Layer — libSQL (Turso-compatible, works on Vercel)
// ============================================================================

import { createClient, type Client, type InStatement } from '@libsql/client';
import type { User, Project, ChangelogEntry, Changelog, Category, BrandingConfig } from './types';
import { DEFAULT_BRANDING } from './types';
import type { PlanId } from './tiers';

let _client: Client | null = null;

export function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:data/shiplog.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

// ============================================================================
// Schema Initialization
// ============================================================================

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    github_id INTEGER UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT NOT NULL DEFAULT '',
    access_token TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_repo_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    full_name TEXT NOT NULL,
    description TEXT,
    default_branch TEXT NOT NULL DEFAULT 'main',
    webhook_id INTEGER,
    webhook_secret TEXT,
    last_synced_at TEXT,
    is_public INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, github_repo_id)
  );

  CREATE TABLE IF NOT EXISTS changelog_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    changelog_id INTEGER REFERENCES changelogs(id) ON DELETE SET NULL,
    pr_number INTEGER NOT NULL,
    pr_title TEXT NOT NULL,
    pr_body TEXT,
    pr_url TEXT NOT NULL,
    pr_author TEXT NOT NULL,
    pr_author_avatar TEXT,
    pr_merged_at TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('feature', 'fix', 'improvement', 'breaking')),
    summary TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '📝',
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(project_id, pr_number)
  );

  CREATE TABLE IF NOT EXISTS changelogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version TEXT,
    title TEXT NOT NULL,
    published_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

const SUBSCRIPTIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    plan_id TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active',
    current_period_start TEXT,
    current_period_end TEXT,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id)
  );
`;

const BRANDING_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS project_branding (
    project_id INTEGER PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    logo_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#6366f1',
    accent_color TEXT NOT NULL DEFAULT '#8b5cf6',
    header_bg TEXT NOT NULL DEFAULT '#09090b',
    page_bg TEXT NOT NULL DEFAULT '#09090b',
    text_color TEXT NOT NULL DEFAULT '#e4e4e7',
    hide_powered_by INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

const INDEXES_SQL = [
  'CREATE INDEX IF NOT EXISTS idx_entries_project ON changelog_entries(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_entries_category ON changelog_entries(category)',
  'CREATE INDEX IF NOT EXISTS idx_entries_merged ON changelog_entries(pr_merged_at)',
  'CREATE INDEX IF NOT EXISTS idx_changelogs_project ON changelogs(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug)',
  'CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id)',
];

let _initialized = false;

async function ensureSchema(): Promise<void> {
  if (_initialized) return;
  const client = getClient();
  // Execute schema as batch of statements
  const statements: InStatement[] = SCHEMA_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s + ';');
  
  for (const stmt of statements) {
    await client.execute(stmt);
  }
  // Subscriptions table
  const subStatements: InStatement[] = SUBSCRIPTIONS_TABLE_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s + ';');
  for (const stmt of subStatements) {
    await client.execute(stmt);
  }

  // Branding table
  const brandingStatements: InStatement[] = BRANDING_TABLE_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s + ';');
  for (const stmt of brandingStatements) {
    await client.execute(stmt);
  }

  for (const idx of INDEXES_SQL) {
    await client.execute(idx);
  }
  await client.execute('PRAGMA foreign_keys = ON');
  _initialized = true;
}

// Helper: convert libSQL row to typed object
function rowToObject<T>(row: Record<string, unknown>): T {
  return row as unknown as T;
}

// ============================================================================
// User Operations
// ============================================================================

export async function upsertUser(data: {
  github_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  access_token: string;
}): Promise<User> {
  await ensureSchema();
  const client = getClient();
  
  // libSQL doesn't support RETURNING in all cases, so do upsert then select
  await client.execute({
    sql: `INSERT INTO users (github_id, username, display_name, avatar_url, access_token)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(github_id) DO UPDATE SET
            username = excluded.username,
            display_name = excluded.display_name,
            avatar_url = excluded.avatar_url,
            access_token = excluded.access_token,
            updated_at = datetime('now')`,
    args: [data.github_id, data.username, data.display_name, data.avatar_url, data.access_token],
  });
  
  const result = await client.execute({
    sql: 'SELECT * FROM users WHERE github_id = ?',
    args: [data.github_id],
  });
  return rowToObject<User>(result.rows[0] as Record<string, unknown>);
}

export async function getUserById(id: number): Promise<User | undefined> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [id],
  });
  return result.rows[0] ? rowToObject<User>(result.rows[0] as Record<string, unknown>) : undefined;
}

export async function getUserByGithubId(githubId: number): Promise<User | undefined> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: 'SELECT * FROM users WHERE github_id = ?',
    args: [githubId],
  });
  return result.rows[0] ? rowToObject<User>(result.rows[0] as Record<string, unknown>) : undefined;
}

// ============================================================================
// Project Operations
// ============================================================================

export async function createProject(data: {
  user_id: number;
  github_repo_id: number;
  name: string;
  slug: string;
  full_name: string;
  description: string | null;
  default_branch: string;
}): Promise<Project> {
  await ensureSchema();
  const client = getClient();
  
  const insertResult = await client.execute({
    sql: `INSERT INTO projects (user_id, github_repo_id, name, slug, full_name, description, default_branch)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [data.user_id, data.github_repo_id, data.name, data.slug, data.full_name, data.description, data.default_branch],
  });
  
  const result = await client.execute({
    sql: 'SELECT * FROM projects WHERE id = ?',
    args: [Number(insertResult.lastInsertRowid)],
  });
  return rowToObject<Project>(result.rows[0] as Record<string, unknown>);
}

export async function getProjectsByUser(userId: number): Promise<Project[]> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: 'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC',
    args: [userId],
  });
  return result.rows.map(r => rowToObject<Project>(r as Record<string, unknown>));
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: 'SELECT * FROM projects WHERE slug = ? AND is_public = 1',
    args: [slug],
  });
  return result.rows[0] ? rowToObject<Project>(result.rows[0] as Record<string, unknown>) : undefined;
}

export async function getProjectById(id: number): Promise<Project | undefined> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: 'SELECT * FROM projects WHERE id = ?',
    args: [id],
  });
  return result.rows[0] ? rowToObject<Project>(result.rows[0] as Record<string, unknown>) : undefined;
}

export async function updateProjectSync(projectId: number, webhookId?: number, webhookSecret?: string): Promise<void> {
  await ensureSchema();
  const client = getClient();
  if (webhookId && webhookSecret) {
    await client.execute({
      sql: `UPDATE projects SET last_synced_at = datetime('now'), webhook_id = ?, webhook_secret = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [webhookId, webhookSecret, projectId],
    });
  } else {
    await client.execute({
      sql: `UPDATE projects SET last_synced_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      args: [projectId],
    });
  }
}

export async function getProjectByWebhookRepoId(repoId: number): Promise<Project | undefined> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: 'SELECT * FROM projects WHERE github_repo_id = ?',
    args: [repoId],
  });
  return result.rows[0] ? rowToObject<Project>(result.rows[0] as Record<string, unknown>) : undefined;
}

// ============================================================================
// Changelog Entry Operations
// ============================================================================

export async function upsertChangelogEntry(data: {
  project_id: number;
  pr_number: number;
  pr_title: string;
  pr_body: string | null;
  pr_url: string;
  pr_author: string;
  pr_author_avatar: string | null;
  pr_merged_at: string;
  category: Category;
  summary: string;
  emoji: string;
}): Promise<ChangelogEntry> {
  await ensureSchema();
  const client = getClient();
  
  await client.execute({
    sql: `INSERT INTO changelog_entries (
            project_id, pr_number, pr_title, pr_body, pr_url, pr_author,
            pr_author_avatar, pr_merged_at, category, summary, emoji
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(project_id, pr_number) DO UPDATE SET
            pr_title = excluded.pr_title,
            pr_body = excluded.pr_body,
            category = excluded.category,
            summary = excluded.summary,
            emoji = excluded.emoji,
            updated_at = datetime('now')`,
    args: [
      data.project_id, data.pr_number, data.pr_title, data.pr_body,
      data.pr_url, data.pr_author, data.pr_author_avatar, data.pr_merged_at,
      data.category, data.summary, data.emoji,
    ],
  });
  
  const result = await client.execute({
    sql: 'SELECT * FROM changelog_entries WHERE project_id = ? AND pr_number = ?',
    args: [data.project_id, data.pr_number],
  });
  return rowToObject<ChangelogEntry>(result.rows[0] as Record<string, unknown>);
}

export async function getEntriesByProject(
  projectId: number,
  options?: { category?: Category; limit?: number; offset?: number }
): Promise<ChangelogEntry[]> {
  await ensureSchema();
  let sql = 'SELECT * FROM changelog_entries WHERE project_id = ? AND is_published = 1';
  const args: (number | string)[] = [projectId];

  if (options?.category) {
    sql += ' AND category = ?';
    args.push(options.category);
  }

  sql += ' ORDER BY pr_merged_at DESC';

  if (options?.limit) {
    sql += ' LIMIT ?';
    args.push(options.limit);
  }

  if (options?.offset) {
    sql += ' OFFSET ?';
    args.push(options.offset);
  }

  const result = await getClient().execute({ sql, args });
  return result.rows.map(r => rowToObject<ChangelogEntry>(r as Record<string, unknown>));
}

export async function getEntryCount(projectId: number, category?: Category): Promise<number> {
  await ensureSchema();
  let sql = 'SELECT COUNT(*) as count FROM changelog_entries WHERE project_id = ? AND is_published = 1';
  const args: (number | string)[] = [projectId];

  if (category) {
    sql += ' AND category = ?';
    args.push(category);
  }

  const result = await getClient().execute({ sql, args });
  const row = result.rows[0] as Record<string, unknown>;
  return Number(row.count);
}

// ============================================================================
// Changelog Operations
// ============================================================================

export async function createChangelog(data: {
  project_id: number;
  version: string | null;
  title: string;
}): Promise<Changelog> {
  await ensureSchema();
  const client = getClient();
  
  const insertResult = await client.execute({
    sql: 'INSERT INTO changelogs (project_id, version, title) VALUES (?, ?, ?)',
    args: [data.project_id, data.version, data.title],
  });
  
  const result = await client.execute({
    sql: 'SELECT * FROM changelogs WHERE id = ?',
    args: [Number(insertResult.lastInsertRowid)],
  });
  return rowToObject<Changelog>(result.rows[0] as Record<string, unknown>);
}

export async function getChangelogsByProject(projectId: number): Promise<Changelog[]> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: 'SELECT * FROM changelogs WHERE project_id = ? ORDER BY published_at DESC',
    args: [projectId],
  });
  return result.rows.map(r => rowToObject<Changelog>(r as Record<string, unknown>));
}

// ============================================================================
// Branding Operations
// ============================================================================

export async function getProjectBranding(projectId: number): Promise<BrandingConfig> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: 'SELECT * FROM project_branding WHERE project_id = ?',
    args: [projectId],
  });

  if (!result.rows[0]) {
    return { ...DEFAULT_BRANDING };
  }

  const row = result.rows[0] as Record<string, unknown>;
  return {
    logo_url: (row.logo_url as string) || null,
    primary_color: (row.primary_color as string) || DEFAULT_BRANDING.primary_color,
    accent_color: (row.accent_color as string) || DEFAULT_BRANDING.accent_color,
    header_bg: (row.header_bg as string) || DEFAULT_BRANDING.header_bg,
    page_bg: (row.page_bg as string) || DEFAULT_BRANDING.page_bg,
    text_color: (row.text_color as string) || DEFAULT_BRANDING.text_color,
    hide_powered_by: Boolean(row.hide_powered_by),
  };
}

export async function upsertProjectBranding(
  projectId: number,
  branding: Partial<BrandingConfig>
): Promise<BrandingConfig> {
  await ensureSchema();
  const client = getClient();

  // Merge with defaults for any missing fields
  const current = await getProjectBranding(projectId);
  const merged = { ...current, ...branding };

  await client.execute({
    sql: `INSERT INTO project_branding (project_id, logo_url, primary_color, accent_color, header_bg, page_bg, text_color, hide_powered_by, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(project_id) DO UPDATE SET
            logo_url = excluded.logo_url,
            primary_color = excluded.primary_color,
            accent_color = excluded.accent_color,
            header_bg = excluded.header_bg,
            page_bg = excluded.page_bg,
            text_color = excluded.text_color,
            hide_powered_by = excluded.hide_powered_by,
            updated_at = datetime('now')`,
    args: [
      projectId,
      merged.logo_url,
      merged.primary_color,
      merged.accent_color,
      merged.header_bg,
      merged.page_bg,
      merged.text_color,
      merged.hide_powered_by ? 1 : 0,
    ],
  });

  return merged;
}

// ============================================================================
// Subscription Operations
// ============================================================================

export interface Subscription {
  id: number;
  user_id: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_id: PlanId;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export async function getSubscription(userId: number): Promise<Subscription | undefined> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: 'SELECT * FROM subscriptions WHERE user_id = ?',
    args: [userId],
  });
  if (!result.rows[0]) return undefined;
  const row = result.rows[0] as Record<string, unknown>;
  return {
    ...rowToObject<Subscription>(row),
    cancel_at_period_end: Boolean(row.cancel_at_period_end),
    plan_id: (row.plan_id as PlanId) || 'free',
  };
}

export async function getSubscriptionByStripeCustomerId(customerId: string): Promise<Subscription | undefined> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: 'SELECT * FROM subscriptions WHERE stripe_customer_id = ?',
    args: [customerId],
  });
  if (!result.rows[0]) return undefined;
  const row = result.rows[0] as Record<string, unknown>;
  return {
    ...rowToObject<Subscription>(row),
    cancel_at_period_end: Boolean(row.cancel_at_period_end),
    plan_id: (row.plan_id as PlanId) || 'free',
  };
}

export async function getSubscriptionByStripeSubId(subId: string): Promise<Subscription | undefined> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: 'SELECT * FROM subscriptions WHERE stripe_subscription_id = ?',
    args: [subId],
  });
  if (!result.rows[0]) return undefined;
  const row = result.rows[0] as Record<string, unknown>;
  return {
    ...rowToObject<Subscription>(row),
    cancel_at_period_end: Boolean(row.cancel_at_period_end),
    plan_id: (row.plan_id as PlanId) || 'free',
  };
}

export async function upsertSubscription(data: {
  user_id: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_id: PlanId;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}): Promise<Subscription> {
  await ensureSchema();
  const client = getClient();

  await client.execute({
    sql: `INSERT INTO subscriptions (
            user_id, stripe_customer_id, stripe_subscription_id, plan_id, status,
            current_period_start, current_period_end, cancel_at_period_end
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            stripe_customer_id = COALESCE(excluded.stripe_customer_id, subscriptions.stripe_customer_id),
            stripe_subscription_id = COALESCE(excluded.stripe_subscription_id, subscriptions.stripe_subscription_id),
            plan_id = excluded.plan_id,
            status = excluded.status,
            current_period_start = COALESCE(excluded.current_period_start, subscriptions.current_period_start),
            current_period_end = COALESCE(excluded.current_period_end, subscriptions.current_period_end),
            cancel_at_period_end = excluded.cancel_at_period_end,
            updated_at = datetime('now')`,
    args: [
      data.user_id,
      data.stripe_customer_id || null,
      data.stripe_subscription_id || null,
      data.plan_id,
      data.status,
      data.current_period_start || null,
      data.current_period_end || null,
      data.cancel_at_period_end ? 1 : 0,
    ],
  });

  return (await getSubscription(data.user_id))!;
}

export async function getUserPlan(userId: number): Promise<PlanId> {
  const sub = await getSubscription(userId);
  if (!sub || sub.status !== 'active') return 'free';
  return sub.plan_id;
}

// getClient already exported at definition
