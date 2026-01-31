import { describe, it, expect } from 'vitest';
import {
  stripHtml,
  sanitizeSlug,
  cleanString,
  isValidUrl,
  isValidHexColor,
  sanitizeEmail,
  clampInt,
} from '../sanitize';

// ============================================================================
// stripHtml
// ============================================================================

describe('stripHtml', () => {
  it('removes simple HTML tags', () => {
    expect(stripHtml('<b>bold</b>')).toBe('bold');
    expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('handles nested tags', () => {
    expect(stripHtml('<div><p>hello</p></div>')).toBe('hello');
  });

  it('preserves plain text', () => {
    expect(stripHtml('no tags here')).toBe('no tags here');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });

  it('strips self-closing tags', () => {
    expect(stripHtml('before<br/>after')).toBe('beforeafter');
    expect(stripHtml('img: <img src="x.png" />')).toBe('img: ');
  });

  it('handles tags with attributes', () => {
    expect(stripHtml('<a href="http://evil.com" onclick="steal()">click</a>')).toBe('click');
  });
});

// ============================================================================
// sanitizeSlug
// ============================================================================

describe('sanitizeSlug', () => {
  it('converts to lowercase', () => {
    expect(sanitizeSlug('My-Project')).toBe('my-project');
  });

  it('replaces invalid chars with hyphens', () => {
    expect(sanitizeSlug('hello world!')).toBe('hello-world'); // trailing hyphen gets trimmed
    expect(sanitizeSlug('my_project@v2')).toBe('my-project-v2');
  });

  it('collapses multiple hyphens', () => {
    expect(sanitizeSlug('a---b')).toBe('a-b');
    expect(sanitizeSlug('hello   world')).toBe('hello-world');
  });

  it('trims leading/trailing hyphens', () => {
    expect(sanitizeSlug('-hello-')).toBe('hello');
    expect(sanitizeSlug('---test---')).toBe('test');
  });

  it('truncates to 128 chars', () => {
    const long = 'a'.repeat(200);
    expect(sanitizeSlug(long).length).toBe(128);
  });

  it('handles empty string', () => {
    expect(sanitizeSlug('')).toBe('');
  });

  it('preserves valid slugs', () => {
    expect(sanitizeSlug('my-cool-project-123')).toBe('my-cool-project-123');
  });
});

// ============================================================================
// cleanString
// ============================================================================

describe('cleanString', () => {
  it('trims whitespace', () => {
    expect(cleanString('  hello  ')).toBe('hello');
  });

  it('truncates to max length', () => {
    expect(cleanString('abcdef', 3)).toBe('abc');
  });

  it('defaults to 1000 char limit', () => {
    const long = 'x'.repeat(1500);
    expect(cleanString(long).length).toBe(1000);
  });

  it('returns empty string for non-string input', () => {
    expect(cleanString(null)).toBe('');
    expect(cleanString(undefined)).toBe('');
    expect(cleanString(42)).toBe('');
    expect(cleanString({})).toBe('');
  });
});

// ============================================================================
// isValidUrl
// ============================================================================

describe('isValidUrl', () => {
  it('accepts http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('accepts https URLs', () => {
    expect(isValidUrl('https://example.com/path?q=1')).toBe(true);
  });

  it('rejects non-http protocols', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUrl('data:text/html,<h1>hi</h1>')).toBe(false);
  });

  it('rejects invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });
});

// ============================================================================
// isValidHexColor
// ============================================================================

describe('isValidHexColor', () => {
  it('accepts 3-char hex', () => {
    expect(isValidHexColor('#fff')).toBe(true);
    expect(isValidHexColor('#F0A')).toBe(true);
  });

  it('accepts 6-char hex', () => {
    expect(isValidHexColor('#ff0000')).toBe(true);
    expect(isValidHexColor('#1A2B3C')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(isValidHexColor('ff0000')).toBe(false);   // no hash
    expect(isValidHexColor('#ff00')).toBe(false);     // 4 chars
    expect(isValidHexColor('#ff000000')).toBe(false); // 8 chars (alpha)
    expect(isValidHexColor('#xyz')).toBe(false);      // invalid hex
    expect(isValidHexColor('red')).toBe(false);
  });
});

// ============================================================================
// sanitizeEmail
// ============================================================================

describe('sanitizeEmail', () => {
  it('accepts valid emails', () => {
    expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
    expect(sanitizeEmail('hello+tag@gmail.com')).toBe('hello+tag@gmail.com');
  });

  it('lowercases and trims', () => {
    expect(sanitizeEmail('  USER@Example.COM  ')).toBe('user@example.com');
  });

  it('rejects invalid emails', () => {
    expect(sanitizeEmail('not-an-email')).toBeNull();
    expect(sanitizeEmail('@no-local.com')).toBeNull();
    expect(sanitizeEmail('no-domain@')).toBeNull();
    expect(sanitizeEmail('')).toBeNull();
  });
});

// ============================================================================
// clampInt
// ============================================================================

describe('clampInt', () => {
  it('clamps within range', () => {
    expect(clampInt(5, 1, 10, 1)).toBe(5);
    expect(clampInt(0, 1, 10, 1)).toBe(1);
    expect(clampInt(20, 1, 10, 1)).toBe(10);
  });

  it('floors floating point', () => {
    expect(clampInt(5.9, 1, 10, 1)).toBe(5);
  });

  it('parses string numbers', () => {
    expect(clampInt('7', 1, 10, 1)).toBe(7);
  });

  it('returns fallback for NaN', () => {
    expect(clampInt('abc', 1, 10, 5)).toBe(5);
    expect(clampInt(null, 1, 10, 5)).toBe(5);
    expect(clampInt(undefined, 1, 10, 5)).toBe(5);
  });
});
