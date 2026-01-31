// ============================================================================
// Database Layer — SQLite via better-sqlite3
// ============================================================================

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { User, Project, ChangelogEntry, Changelog, Category } from './types';

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'shiplog.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initializeSchema(_db);
  }
  return _db;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
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

    CREATE INDEX IF NOT EXISTS idx_entries_project ON changelog_entries(project_id);
    CREATE INDEX IF NOT EXISTS idx_entries_category ON changelog_entries(category);
    CREATE INDEX IF NOT EXISTS idx_entries_merged ON changelog_entries(pr_merged_at);
    CREATE INDEX IF NOT EXISTS idx_changelogs_project ON changelogs(project_id);
    CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
    CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
  `);
}

// ============================================================================
// User Operations
// ============================================================================

export function upsertUser(data: {
  github_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  access_token: string;
}): User {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO users (github_id, username, display_name, avatar_url, access_token)
    VALUES (@github_id, @username, @display_name, @avatar_url, @access_token)
    ON CONFLICT(github_id) DO UPDATE SET
      username = @username,
      display_name = @display_name,
      avatar_url = @avatar_url,
      access_token = @access_token,
      updated_at = datetime('now')
    RETURNING *
  `);
  return stmt.get(data) as User;
}

export function getUserById(id: number): User | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export function getUserByGithubId(githubId: number): User | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE github_id = ?').get(githubId) as User | undefined;
}

// ============================================================================
// Project Operations
// ============================================================================

export function createProject(data: {
  user_id: number;
  github_repo_id: number;
  name: string;
  slug: string;
  full_name: string;
  description: string | null;
  default_branch: string;
}): Project {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO projects (user_id, github_repo_id, name, slug, full_name, description, default_branch)
    VALUES (@user_id, @github_repo_id, @name, @slug, @full_name, @description, @default_branch)
    RETURNING *
  `);
  return stmt.get(data) as Project;
}

export function getProjectsByUser(userId: number): Project[] {
  const db = getDb();
  return db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC').all(userId) as Project[];
}

export function getProjectBySlug(slug: string): Project | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM projects WHERE slug = ? AND is_public = 1').get(slug) as Project | undefined;
}

export function getProjectById(id: number): Project | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
}

export function updateProjectSync(projectId: number, webhookId?: number, webhookSecret?: string): void {
  const db = getDb();
  if (webhookId && webhookSecret) {
    db.prepare(`
      UPDATE projects SET last_synced_at = datetime('now'), webhook_id = ?, webhook_secret = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(webhookId, webhookSecret, projectId);
  } else {
    db.prepare(`
      UPDATE projects SET last_synced_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
    `).run(projectId);
  }
}

export function getProjectByWebhookRepoId(repoId: number): Project | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM projects WHERE github_repo_id = ?').get(repoId) as Project | undefined;
}

// ============================================================================
// Changelog Entry Operations
// ============================================================================

export function upsertChangelogEntry(data: {
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
}): ChangelogEntry {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO changelog_entries (
      project_id, pr_number, pr_title, pr_body, pr_url, pr_author,
      pr_author_avatar, pr_merged_at, category, summary, emoji
    ) VALUES (
      @project_id, @pr_number, @pr_title, @pr_body, @pr_url, @pr_author,
      @pr_author_avatar, @pr_merged_at, @category, @summary, @emoji
    )
    ON CONFLICT(project_id, pr_number) DO UPDATE SET
      pr_title = @pr_title,
      pr_body = @pr_body,
      category = @category,
      summary = @summary,
      emoji = @emoji,
      updated_at = datetime('now')
    RETURNING *
  `);
  return stmt.get(data) as ChangelogEntry;
}

export function getEntriesByProject(
  projectId: number,
  options?: { category?: Category; limit?: number; offset?: number }
): ChangelogEntry[] {
  const db = getDb();
  let query = 'SELECT * FROM changelog_entries WHERE project_id = ? AND is_published = 1';
  const params: (number | string)[] = [projectId];

  if (options?.category) {
    query += ' AND category = ?';
    params.push(options.category);
  }

  query += ' ORDER BY pr_merged_at DESC';

  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }

  if (options?.offset) {
    query += ' OFFSET ?';
    params.push(options.offset);
  }

  return db.prepare(query).all(...params) as ChangelogEntry[];
}

export function getEntryCount(projectId: number, category?: Category): number {
  const db = getDb();
  let query = 'SELECT COUNT(*) as count FROM changelog_entries WHERE project_id = ? AND is_published = 1';
  const params: (number | string)[] = [projectId];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  const result = db.prepare(query).get(...params) as { count: number };
  return result.count;
}

// ============================================================================
// Changelog Operations
// ============================================================================

export function createChangelog(data: {
  project_id: number;
  version: string | null;
  title: string;
}): Changelog {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO changelogs (project_id, version, title)
    VALUES (@project_id, @version, @title)
    RETURNING *
  `);
  return stmt.get(data) as Changelog;
}

export function getChangelogsByProject(projectId: number): Changelog[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM changelogs WHERE project_id = ? ORDER BY published_at DESC'
  ).all(projectId) as Changelog[];
}

export { getDb };
