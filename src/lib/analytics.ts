// ============================================================================
// Analytics — Lightweight event tracking for changelogs
// ============================================================================

import { getClient } from './db';

export type AnalyticsEvent = 'page_view' | 'widget_view' | 'entry_click' | 'subscribe' | 'rss_fetch';

export interface AnalyticsRecord {
  id: number;
  project_id: number;
  event_type: AnalyticsEvent;
  entry_id: number | null;
  visitor_hash: string | null; // anonymized IP hash (no PII stored)
  referrer: string | null;
  user_agent: string | null;
  country: string | null;
  created_at: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  widgetViews: number;
  topEntries: Array<{ entry_id: number; pr_title: string; views: number }>;
  viewsByDay: Array<{ date: string; views: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  subscribers: number;
}

// Schema — called from db.ts ensureSchema
export const ANALYTICS_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK(event_type IN ('page_view', 'widget_view', 'entry_click', 'subscribe', 'rss_fetch')),
    entry_id INTEGER REFERENCES changelog_entries(id) ON DELETE SET NULL,
    visitor_hash TEXT,
    referrer TEXT,
    user_agent TEXT,
    country TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_analytics_project ON analytics_events(project_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
  CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
  CREATE INDEX IF NOT EXISTS idx_analytics_visitor ON analytics_events(visitor_hash);
`;

export async function trackEvent(data: {
  project_id: number;
  event_type: AnalyticsEvent;
  entry_id?: number | null;
  visitor_hash?: string | null;
  referrer?: string | null;
  user_agent?: string | null;
  country?: string | null;
}): Promise<void> {
  const client = getClient();
  await client.execute({
    sql: `INSERT INTO analytics_events (project_id, event_type, entry_id, visitor_hash, referrer, user_agent, country)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.project_id,
      data.event_type,
      data.entry_id ?? null,
      data.visitor_hash ?? null,
      data.referrer ?? null,
      data.user_agent ?? null,
      data.country ?? null,
    ],
  });
}

export async function getAnalyticsSummary(
  projectId: number,
  days: number = 30
): Promise<AnalyticsSummary> {
  const client = getClient();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // Total page views
  const viewsResult = await client.execute({
    sql: `SELECT COUNT(*) as count FROM analytics_events
          WHERE project_id = ? AND event_type = 'page_view' AND created_at >= ?`,
    args: [projectId, since],
  });
  const totalViews = Number((viewsResult.rows[0] as Record<string, unknown>)?.count ?? 0);

  // Unique visitors (by hash)
  const uniqueResult = await client.execute({
    sql: `SELECT COUNT(DISTINCT visitor_hash) as count FROM analytics_events
          WHERE project_id = ? AND event_type IN ('page_view', 'widget_view') AND created_at >= ? AND visitor_hash IS NOT NULL`,
    args: [projectId, since],
  });
  const uniqueVisitors = Number((uniqueResult.rows[0] as Record<string, unknown>)?.count ?? 0);

  // Widget views
  const widgetResult = await client.execute({
    sql: `SELECT COUNT(*) as count FROM analytics_events
          WHERE project_id = ? AND event_type = 'widget_view' AND created_at >= ?`,
    args: [projectId, since],
  });
  const widgetViews = Number((widgetResult.rows[0] as Record<string, unknown>)?.count ?? 0);

  // Top entries by clicks
  const topEntriesResult = await client.execute({
    sql: `SELECT ae.entry_id, ce.pr_title, COUNT(*) as views
          FROM analytics_events ae
          JOIN changelog_entries ce ON ae.entry_id = ce.id
          WHERE ae.project_id = ? AND ae.event_type = 'entry_click' AND ae.created_at >= ?
          GROUP BY ae.entry_id
          ORDER BY views DESC
          LIMIT 10`,
    args: [projectId, since],
  });
  const topEntries = topEntriesResult.rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      entry_id: Number(row.entry_id),
      pr_title: String(row.pr_title),
      views: Number(row.views),
    };
  });

  // Views by day
  const byDayResult = await client.execute({
    sql: `SELECT DATE(created_at) as date, COUNT(*) as views
          FROM analytics_events
          WHERE project_id = ? AND event_type IN ('page_view', 'widget_view') AND created_at >= ?
          GROUP BY DATE(created_at)
          ORDER BY date ASC`,
    args: [projectId, since],
  });
  const viewsByDay = byDayResult.rows.map((r) => {
    const row = r as Record<string, unknown>;
    return { date: String(row.date), views: Number(row.views) };
  });

  // Top referrers
  const referrerResult = await client.execute({
    sql: `SELECT referrer, COUNT(*) as count
          FROM analytics_events
          WHERE project_id = ? AND referrer IS NOT NULL AND referrer != '' AND created_at >= ?
          GROUP BY referrer
          ORDER BY count DESC
          LIMIT 10`,
    args: [projectId, since],
  });
  const topReferrers = referrerResult.rows.map((r) => {
    const row = r as Record<string, unknown>;
    return { referrer: String(row.referrer), count: Number(row.count) };
  });

  // Subscriber count
  const subResult = await client.execute({
    sql: `SELECT COUNT(*) as count FROM analytics_events
          WHERE project_id = ? AND event_type = 'subscribe'`,
    args: [projectId],
  });
  const subscribers = Number((subResult.rows[0] as Record<string, unknown>)?.count ?? 0);

  return { totalViews, uniqueVisitors, widgetViews, topEntries, viewsByDay, topReferrers, subscribers };
}
