// ============================================================================
// /api/keys — API Key management (CRUD)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getClient } from '@/lib/db';
import { getUserPlan } from '@/lib/db';
import {
  generateApiKey,
  validateScopes,
  API_KEYS_SCHEMA_SQL,
  type ApiKey,
} from '@/lib/api-keys';
import { cleanString as sanitize } from '@/lib/sanitize';

let _schemaInit = false;
async function ensureApiKeysSchema() {
  if (_schemaInit) return;
  const client = getClient();
  const stmts = API_KEYS_SCHEMA_SQL.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of stmts) {
    await client.execute(stmt + ';');
  }
  _schemaInit = true;
}

// GET — List API keys (masked)
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // API access is Pro+ only
  const plan = await getUserPlan(session.userId);
  if (plan === 'free') {
    return NextResponse.json({ error: 'API access requires Pro plan or higher' }, { status: 403 });
  }

  await ensureApiKeysSchema();
  const result = await getClient().execute({
    sql: 'SELECT id, name, key_prefix, scopes, last_used_at, expires_at, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC',
    args: [session.userId],
  });

  const keys = result.rows.map(r => ({
    id: r.id,
    name: r.name,
    key_prefix: r.key_prefix,
    scopes: JSON.parse((r.scopes as string) || '["read"]'),
    last_used_at: r.last_used_at,
    expires_at: r.expires_at,
    created_at: r.created_at,
  }));

  return NextResponse.json({ keys });
}

// POST — Generate a new API key
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const plan = await getUserPlan(session.userId);
  if (plan === 'free') {
    return NextResponse.json({ error: 'API access requires Pro plan or higher' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, scopes, expires_in_days } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const sanitizedName = sanitize(name).substring(0, 100);
    const validScopes = validateScopes(scopes || ['read']);

    if (validScopes.length === 0) {
      return NextResponse.json({ error: 'At least one valid scope required (read, write)' }, { status: 400 });
    }

    await ensureApiKeysSchema();

    // Limit: max 10 keys per user
    const countResult = await getClient().execute({
      sql: 'SELECT COUNT(*) as count FROM api_keys WHERE user_id = ?',
      args: [session.userId],
    });
    if (Number((countResult.rows[0] as Record<string, unknown>).count) >= 10) {
      return NextResponse.json({ error: 'Max 10 API keys per account' }, { status: 400 });
    }

    // Generate key
    const { fullKey, prefix, hash } = generateApiKey();

    // Compute expiry
    let expiresAt: string | null = null;
    if (expires_in_days && Number(expires_in_days) > 0) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + Number(expires_in_days));
      expiresAt = expiry.toISOString();
    }

    await getClient().execute({
      sql: `INSERT INTO api_keys (user_id, name, key_prefix, key_hash, scopes, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [session.userId, sanitizedName, prefix, hash, JSON.stringify(validScopes), expiresAt],
    });

    // Return full key ONCE — never stored or shown again
    return NextResponse.json({
      key: fullKey,
      prefix,
      name: sanitizedName,
      scopes: validScopes,
      expires_at: expiresAt,
      warning: 'Save this key now — it will not be shown again.',
    });
  } catch (err) {
    console.error('[api-keys] Create error:', err);
    return NextResponse.json({ error: 'Failed to create key' }, { status: 500 });
  }
}

// DELETE — Revoke an API key
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const keyId = request.nextUrl.searchParams.get('id');
  if (!keyId) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await ensureApiKeysSchema();
  await getClient().execute({
    sql: 'DELETE FROM api_keys WHERE id = ? AND user_id = ?',
    args: [Number(keyId), session.userId],
  });

  return NextResponse.json({ revoked: true });
}
