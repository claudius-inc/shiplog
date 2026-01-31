// ============================================================================
// API Authentication Middleware — validates API keys from Authorization header
// ============================================================================

import { NextRequest } from 'next/server';
import { getClient } from './db';
import { hashKey, isValidKeyFormat, hasScope, API_KEYS_SCHEMA_SQL, type ApiScope } from './api-keys';

export interface AuthenticatedApiUser {
  userId: number;
  keyId: number;
  scopes: string;
}

let _schemaInit = false;
async function ensureSchema() {
  if (_schemaInit) return;
  const client = getClient();
  const stmts = API_KEYS_SCHEMA_SQL.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of stmts) {
    await client.execute(stmt + ';');
  }
  _schemaInit = true;
}

/**
 * Authenticate a request using the Authorization: Bearer <api_key> header
 * Returns the authenticated user or null
 */
export async function authenticateApiKey(request: NextRequest): Promise<AuthenticatedApiUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const key = authHeader.substring(7).trim();
  if (!isValidKeyFormat(key)) return null;

  const keyHash = hashKey(key);
  await ensureSchema();

  const result = await getClient().execute({
    sql: 'SELECT id, user_id, scopes, expires_at FROM api_keys WHERE key_hash = ?',
    args: [keyHash],
  });

  if (!result.rows[0]) return null;

  const row = result.rows[0] as Record<string, unknown>;

  // Check expiry
  if (row.expires_at) {
    const expiry = new Date(row.expires_at as string);
    if (expiry < new Date()) return null;
  }

  // Update last_used_at
  await getClient().execute({
    sql: "UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?",
    args: [row.id as number],
  });

  return {
    userId: row.user_id as number,
    keyId: row.id as number,
    scopes: row.scopes as string,
  };
}

/**
 * Check if the authenticated API user has the required scope
 */
export function requireScope(user: AuthenticatedApiUser, scope: ApiScope): boolean {
  return hasScope(user.scopes, scope);
}
