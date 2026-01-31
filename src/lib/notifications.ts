// ============================================================================
// Notification System — Slack & Discord webhook notifications
// ============================================================================

import type { ChangelogEntry, Project } from './types';

export type NotificationProvider = 'slack' | 'discord';

export interface NotificationConfig {
  id: number;
  project_id: number;
  provider: NotificationProvider;
  webhook_url: string;
  enabled: boolean;
  events: string; // JSON array of event types: ["new_entry", "new_release"]
  created_at: string;
  updated_at: string;
}

export const NOTIFICATION_EVENTS = ['new_entry', 'new_release'] as const;
export type NotificationEvent = typeof NOTIFICATION_EVENTS[number];

// ============================================================================
// Schema
// ============================================================================

export const NOTIFICATIONS_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS notification_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK(provider IN ('slack', 'discord')),
    webhook_url TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    events TEXT NOT NULL DEFAULT '["new_entry","new_release"]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_notif_project ON notification_configs(project_id);
`;

// ============================================================================
// Message Formatting
// ============================================================================

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  feature: { label: '✨ New Feature', color: '#22c55e' },
  fix: { label: '🐛 Bug Fix', color: '#ef4444' },
  improvement: { label: '🔄 Improvement', color: '#3b82f6' },
  breaking: { label: '💥 Breaking Change', color: '#f97316' },
};

/**
 * Format a Slack webhook message for a new changelog entry
 */
function formatSlackMessage(entry: ChangelogEntry, project: Project): object {
  const cat = CATEGORY_LABELS[entry.category] || CATEGORY_LABELS.improvement;
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${entry.emoji} ${project.name} — New Changelog Entry`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Category:*\n${cat.label}`,
          },
          {
            type: 'mrkdwn',
            text: `*PR:*\n<${entry.pr_url}|#${entry.pr_number}>`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${entry.summary}*`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `By ${entry.pr_author} · Merged ${new Date(entry.pr_merged_at).toLocaleDateString()}`,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `View full changelog → *<https://shiplog.dev/${project.slug}|${project.name}>*`,
          },
        ],
      },
    ],
  };
}

/**
 * Format a Discord webhook message for a new changelog entry
 */
function formatDiscordMessage(entry: ChangelogEntry, project: Project): object {
  const cat = CATEGORY_LABELS[entry.category] || CATEGORY_LABELS.improvement;
  return {
    embeds: [
      {
        title: `${entry.emoji} ${project.name} — New Changelog Entry`,
        color: parseInt(cat.color.replace('#', ''), 16),
        fields: [
          { name: 'Category', value: cat.label, inline: true },
          { name: 'PR', value: `[#${entry.pr_number}](${entry.pr_url})`, inline: true },
          { name: 'Summary', value: entry.summary },
          { name: 'Author', value: entry.pr_author, inline: true },
          { name: 'Merged', value: new Date(entry.pr_merged_at).toLocaleDateString(), inline: true },
        ],
        footer: {
          text: `ShipLog — ${project.name}`,
        },
        timestamp: entry.pr_merged_at,
      },
    ],
  };
}

/**
 * Format a release notification for Slack
 */
function formatSlackRelease(version: string, title: string, project: Project, entryCount: number): object {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚀 ${project.name} ${version} Released!`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${title}*\n${entryCount} change${entryCount !== 1 ? 's' : ''} in this release.`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `View release → *<https://shiplog.dev/${project.slug}|${project.name}>*`,
          },
        ],
      },
    ],
  };
}

/**
 * Format a release notification for Discord
 */
function formatDiscordRelease(version: string, title: string, project: Project, entryCount: number): object {
  return {
    embeds: [
      {
        title: `🚀 ${project.name} ${version} Released!`,
        description: `**${title}**\n${entryCount} change${entryCount !== 1 ? 's' : ''} in this release.`,
        color: 0x6366f1,
        footer: { text: `ShipLog — ${project.name}` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// ============================================================================
// Dispatcher
// ============================================================================

/**
 * Send a notification to a webhook URL
 */
async function sendWebhook(url: string, body: object): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error('[notifications] Webhook send failed:', err);
    return { ok: false, status: 0 };
  }
}

/**
 * Notify all configured integrations for a new changelog entry
 */
export async function notifyNewEntry(
  configs: NotificationConfig[],
  entry: ChangelogEntry,
  project: Project
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const config of configs) {
    if (!config.enabled) continue;

    const events: string[] = JSON.parse(config.events || '[]');
    if (!events.includes('new_entry')) continue;

    const body =
      config.provider === 'slack'
        ? formatSlackMessage(entry, project)
        : formatDiscordMessage(entry, project);

    const result = await sendWebhook(config.webhook_url, body);
    if (result.ok) sent++;
    else failed++;
  }

  return { sent, failed };
}

/**
 * Notify all configured integrations for a new release
 */
export async function notifyNewRelease(
  configs: NotificationConfig[],
  version: string,
  title: string,
  project: Project,
  entryCount: number
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const config of configs) {
    if (!config.enabled) continue;

    const events: string[] = JSON.parse(config.events || '[]');
    if (!events.includes('new_release')) continue;

    const body =
      config.provider === 'slack'
        ? formatSlackRelease(version, title, project, entryCount)
        : formatDiscordRelease(version, title, project, entryCount);

    const result = await sendWebhook(config.webhook_url, body);
    if (result.ok) sent++;
    else failed++;
  }

  return { sent, failed };
}

/**
 * Test a webhook URL by sending a test message
 */
export async function testNotification(
  provider: NotificationProvider,
  webhookUrl: string,
  projectName: string
): Promise<boolean> {
  const body =
    provider === 'slack'
      ? {
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `✅ *ShipLog notification test successful!*\nYou'll receive changelog updates for *${projectName}* here.`,
              },
            },
          ],
        }
      : {
          embeds: [
            {
              title: '✅ ShipLog Notification Test',
              description: `You'll receive changelog updates for **${projectName}** here.`,
              color: 0x22c55e,
            },
          ],
        };

  const result = await sendWebhook(webhookUrl, body);
  return result.ok;
}
