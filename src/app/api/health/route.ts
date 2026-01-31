// ============================================================================
// Health Check Endpoint — for monitoring & deployment verification
// ============================================================================

import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const startMs = Date.now();
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // Database connectivity check
  try {
    const dbStart = Date.now();
    const client = getClient();
    await client.execute('SELECT 1 as ping');
    checks.database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (e) {
    checks.database = { ok: false, error: e instanceof Error ? e.message : 'Unknown DB error' };
  }

  // Environment check (verify critical env vars are set, don't leak values)
  const requiredEnvVars = ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'SESSION_SECRET'];
  const missingEnv = requiredEnvVars.filter((v) => !process.env[v]);
  checks.environment = {
    ok: missingEnv.length === 0,
    ...(missingEnv.length > 0 ? { error: `Missing: ${missingEnv.join(', ')}` } : {}),
  };

  const allHealthy = Object.values(checks).every((c) => c.ok);
  const totalMs = Date.now() - startMs;

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      version: process.env.npm_package_version || '0.1.0',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      latencyMs: totalMs,
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
