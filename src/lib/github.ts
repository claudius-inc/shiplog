// ============================================================================
// GitHub API Integration
// ============================================================================

import type { GitHubRepo, GitHubPR } from './types';

const GITHUB_API = 'https://api.github.com';

class GitHubClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error (${response.status}): ${error}`);
    }

    return response.json() as Promise<T>;
  }

  // ========================================================================
  // User
  // ========================================================================

  async getAuthenticatedUser(): Promise<{
    id: number;
    login: string;
    name: string | null;
    avatar_url: string;
  }> {
    return this.request('/user');
  }

  // ========================================================================
  // Repositories
  // ========================================================================

  async listRepos(options?: {
    sort?: 'updated' | 'pushed' | 'full_name';
    per_page?: number;
    page?: number;
  }): Promise<GitHubRepo[]> {
    const params = new URLSearchParams({
      sort: options?.sort || 'updated',
      per_page: String(options?.per_page || 30),
      page: String(options?.page || 1),
      type: 'owner',
    });
    return this.request(`/user/repos?${params}`);
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    return this.request(`/repos/${owner}/${repo}`);
  }

  // ========================================================================
  // Pull Requests
  // ========================================================================

  async getMergedPRs(
    owner: string,
    repo: string,
    options?: { since?: string; per_page?: number; page?: number }
  ): Promise<GitHubPR[]> {
    const params = new URLSearchParams({
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: String(options?.per_page || 30),
      page: String(options?.page || 1),
    });

    if (options?.since) {
      params.set('since', options.since);
    }

    const prs = await this.request<GitHubPR[]>(
      `/repos/${owner}/${repo}/pulls?${params}`
    );

    // Filter to only merged PRs
    return prs.filter((pr) => pr.merged_at !== null);
  }

  async getPRDiff(owner: string, repo: string, prNumber: number): Promise<string> {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3.diff',
      },
    });

    if (!response.ok) {
      return ''; // Gracefully handle diff fetch failure
    }

    const diff = await response.text();
    // Truncate diff to keep AI context manageable
    return diff.slice(0, 4000);
  }

  // ========================================================================
  // Webhooks
  // ========================================================================

  async createWebhook(
    owner: string,
    repo: string,
    callbackUrl: string,
    secret: string
  ): Promise<{ id: number }> {
    return this.request(`/repos/${owner}/${repo}/hooks`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: ['pull_request'],
        config: {
          url: callbackUrl,
          content_type: 'json',
          secret,
          insecure_ssl: '0',
        },
      }),
    });
  }

  async deleteWebhook(owner: string, repo: string, hookId: number): Promise<void> {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/hooks/${hookId}`;
    await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
  }
}

// ============================================================================
// OAuth Helpers
// ============================================================================

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

export function getOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID || '',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
    scope: 'repo read:user',
    state,
  });

  return `https://github.com/login/oauth/authorize?${params}`;
}

export function createGitHubClient(token: string): GitHubClient {
  return new GitHubClient(token);
}

export { GitHubClient };
