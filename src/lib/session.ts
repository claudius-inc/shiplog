// ============================================================================
// Session Management — Cookie-based sessions
// ============================================================================

import { cookies } from 'next/headers';
import crypto from 'crypto';
import type { Session } from './types';

const SESSION_COOKIE = 'shiplog_session';
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production-please';

// Derive key once at startup (scrypt is expensive — don't call per-request)
// Use a proper salt derived from the secret itself for deterministic key derivation
const SESSION_KEY_SALT = crypto.createHash('sha256').update(`shiplog-session-salt:${SECRET}`).digest().slice(0, 16);
let _derivedKey: Buffer | null = null;
function getDerivedKey(): Buffer {
  if (!_derivedKey) {
    _derivedKey = crypto.scryptSync(SECRET, SESSION_KEY_SALT, 32);
  }
  return _derivedKey;
}

function encrypt(data: string): string {
  const key = getDerivedKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

function decrypt(data: string): string {
  const [ivHex, tagHex, encrypted] = data.split(':');
  if (!ivHex || !tagHex || !encrypted) throw new Error('Malformed session data');
  const key = getDerivedKey();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function createSession(session: Session): Promise<void> {
  const encrypted = encrypt(JSON.stringify(session));
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE);
    if (!cookie?.value) return null;

    const decrypted = decrypt(cookie.value);
    return JSON.parse(decrypted) as Session;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}
