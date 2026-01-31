// ============================================================================
// Input Sanitization — prevent XSS, SQL injection, and abuse
// ============================================================================

/**
 * Strip HTML tags to prevent stored XSS.
 * For markdown rendering, sanitize at display time (marked handles this).
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize a slug — only allow lowercase alphanumeric + hyphens.
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 128);
}

/**
 * Validate and clamp a string to max length, trimming whitespace.
 */
export function cleanString(input: unknown, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

/**
 * Validate a URL — only allow http/https protocols.
 */
export function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate a hex color string (#RGB or #RRGGBB).
 */
export function isValidHexColor(input: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(input);
}

/**
 * Sanitize an email address — basic validation + normalization.
 */
export function sanitizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  // RFC 5322 simplified — good enough for subscription forms
  const emailRegex = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;
  return emailRegex.test(email) ? email : null;
}

/**
 * Validate integer within bounds.
 */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (isNaN(num)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(num)));
}
