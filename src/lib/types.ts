// ============================================================================
// ShipLog Core Types
// ============================================================================

export type Category = 'feature' | 'fix' | 'improvement' | 'breaking';

export interface User {
  id: number;
  github_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  access_token: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  user_id: number;
  github_repo_id: number;
  name: string;
  slug: string;
  full_name: string; // owner/repo
  description: string | null;
  default_branch: string;
  webhook_id: number | null;
  webhook_secret: string | null;
  last_synced_at: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChangelogEntry {
  id: number;
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
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Changelog {
  id: number;
  project_id: number;
  version: string | null;
  title: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChangelogWithEntries extends Changelog {
  entries: ChangelogEntry[];
}

// GitHub API types
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  merged_at: string | null;
  base: {
    ref: string;
  };
  labels: Array<{ name: string }>;
}

// AI categorization
export interface AICategorization {
  category: Category;
  summary: string;
  emoji: string;
}

// Branding
export interface BrandingConfig {
  logo_url: string | null;
  primary_color: string;    // Main accent color (buttons, links, badges)
  accent_color: string;     // Secondary accent (highlights)
  header_bg: string;        // Header background
  page_bg: string;          // Page background
  text_color: string;       // Primary text
  hide_powered_by: boolean; // Remove "Powered by ShipLog" (paid feature)
}

export const DEFAULT_BRANDING: BrandingConfig = {
  logo_url: null,
  primary_color: '#6366f1',   // indigo
  accent_color: '#8b5cf6',    // violet
  header_bg: '#09090b',       // zinc-950
  page_bg: '#09090b',         // zinc-950
  text_color: '#e4e4e7',      // zinc-200
  hide_powered_by: false,
};

// Session
export interface Session {
  userId: number;
  username: string;
  accessToken: string;
}
