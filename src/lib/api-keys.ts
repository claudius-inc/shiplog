// ============================================================================
// API Key Management — Public REST API authentication
// ============================================================================

import crypto from 'crypto';

export interface ApiKey {
  id: number;
  user_id: number;
  name: string;
  key_prefix: string;    // First 8 chars shown in UI (sl_live_xxxx)
  key_hash: string;       // SHA-256 hash of full key
  scopes: string;         // JSON array: ["read", "write"]
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export type ApiScope = 'read' | 'write';
export const ALL_SCOPES: ApiScope[] = ['read', 'write'];

// ============================================================================
// Schema
// ============================================================================

export const API_KEYS_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    scopes TEXT NOT NULL DEFAULT '["read"]',
    last_used_at TEXT,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_apikeys_user ON api_keys(user_id);
  CREATE INDEX IF NOT EXISTS idx_apikeys_hash ON api_keys(key_hash);
`;

// ============================================================================
// Key Generation
// ============================================================================

const KEY_PREFIX = 'sl_live_';

/**
 * Generate a new API key. Returns the full key (only shown once) and metadata.
 */
export function generateApiKey(): { fullKey: string; prefix: string; hash: string } {
  const random = crypto.randomBytes(32).toString('base64url');
  const fullKey = `${KEY_PREFIX}${random}`;
  const prefix = fullKey.substring(0, 16); // "sl_live_" + 8 chars
  const hash = hashKey(fullKey);
  return { fullKey, prefix, hash };
}

/**
 * Hash an API key for storage
 */
export function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Validate API key format
 */
export function isValidKeyFormat(key: string): boolean {
  return key.startsWith(KEY_PREFIX) && key.length > 20;
}

// ============================================================================
// Scope Checks
// ============================================================================

export function hasScope(scopes: string, required: ApiScope): boolean {
  try {
    const parsed: string[] = JSON.parse(scopes);
    return parsed.includes(required);
  } catch {
    return false;
  }
}

export function validateScopes(scopes: string[]): ApiScope[] {
  return scopes.filter((s): s is ApiScope => ALL_SCOPES.includes(s as ApiScope));
}
