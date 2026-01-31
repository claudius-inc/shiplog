// ============================================================================
// Session Management — Cookie-based sessions
// ============================================================================

import { cookies } from 'next/headers';
import crypto from 'crypto';
import type { Session } from './types';

const SESSION_COOKIE = 'shiplog_session';
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production-please';

function encrypt(data: string): string {
  const key = crypto.scryptSync(SECRET, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

function decrypt(data: string): string {
  const [ivHex, tagHex, encrypted] = data.split(':');
  const key = crypto.scryptSync(SECRET, 'salt', 32);
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
