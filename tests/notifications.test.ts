// ============================================================================
// Tests for notifications.ts — message formatting
// ============================================================================

import { describe, it, expect, vi, afterEach } from 'vitest';
import { notifyNewEntry, notifyNewRelease, type NotificationConfig } from '../src/lib/notifications';
import type { ChangelogEntry, Project } from '../src/lib/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockProject: Project = {
  id: 1,
  user_id: 1,
  github_repo_id: 123,
  name: 'test-project',
  slug: 'test-project',
  full_name: 'user/test-project',
  description: 'A test project',
  default_branch: 'main',
  webhook_id: null,
  webhook_secret: null,
  last_synced_at: null,
  is_public: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockEntry: ChangelogEntry = {
  id: 1,
  project_id: 1,
  pr_number: 42,
  pr_title: 'Add dark mode',
  pr_body: null,
  pr_url: 'https://github.com/user/test-project/pull/42',
  pr_author: 'dev',
  pr_author_avatar: null,
  pr_merged_at: '2024-01-15T12:00:00Z',
  category: 'feature',
  summary: 'Added dark mode support',
  emoji: '✨',
  is_published: true,
  created_at: '2024-01-15T12:00:00Z',
  updated_at: '2024-01-15T12:00:00Z',
};

describe('notifyNewEntry', () => {
  it('sends to enabled Slack configs only', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const configs: NotificationConfig[] = [
      {
        id: 1,
        project_id: 1,
        provider: 'slack',
        webhook_url: 'https://hooks.slack.com/services/test',
        enabled: true,
        events: '["new_entry"]',
        created_at: '',
        updated_at: '',
      },
      {
        id: 2,
        project_id: 1,
        provider: 'discord',
        webhook_url: 'https://discord.com/api/webhooks/test',
        enabled: false, // disabled
        events: '["new_entry"]',
        created_at: '',
        updated_at: '',
      },
    ];

    const result = await notifyNewEntry(configs, mockEntry, mockProject);
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('skips configs without new_entry event', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const configs: NotificationConfig[] = [
      {
        id: 1,
        project_id: 1,
        provider: 'slack',
        webhook_url: 'https://hooks.slack.com/services/test',
        enabled: true,
        events: '["new_release"]', // only release events
        created_at: '',
        updated_at: '',
      },
    ];

    const result = await notifyNewEntry(configs, mockEntry, mockProject);
    expect(result.sent).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('counts failed webhooks', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    const configs: NotificationConfig[] = [
      {
        id: 1,
        project_id: 1,
        provider: 'slack',
        webhook_url: 'https://hooks.slack.com/services/bad',
        enabled: true,
        events: '["new_entry"]',
        created_at: '',
        updated_at: '',
      },
    ];

    const result = await notifyNewEntry(configs, mockEntry, mockProject);
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
  });

  afterEach(() => {
    mockFetch.mockReset();
  });
});

describe('notifyNewRelease', () => {
  it('sends release notifications to all enabled configs', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const configs: NotificationConfig[] = [
      {
        id: 1,
        project_id: 1,
        provider: 'slack',
        webhook_url: 'https://hooks.slack.com/services/test',
        enabled: true,
        events: '["new_release"]',
        created_at: '',
        updated_at: '',
      },
      {
        id: 2,
        project_id: 1,
        provider: 'discord',
        webhook_url: 'https://discord.com/api/webhooks/test',
        enabled: true,
        events: '["new_entry","new_release"]',
        created_at: '',
        updated_at: '',
      },
    ];

    const result = await notifyNewRelease(configs, '2.0.0', 'Major Update', mockProject, 15);
    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
  });

  afterEach(() => {
    mockFetch.mockReset();
  });
});
