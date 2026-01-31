// ============================================================================
// Tests for api-keys.ts
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  generateApiKey,
  hashKey,
  isValidKeyFormat,
  hasScope,
  validateScopes,
} from '../src/lib/api-keys';

describe('generateApiKey', () => {
  it('generates a key with correct prefix', () => {
    const { fullKey, prefix, hash } = generateApiKey();
    expect(fullKey).toMatch(/^sl_live_/);
    expect(prefix).toBe(fullKey.substring(0, 16));
    expect(hash).toHaveLength(64); // SHA-256 hex
  });

  it('generates unique keys each time', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const { fullKey } = generateApiKey();
      expect(keys.has(fullKey)).toBe(false);
      keys.add(fullKey);
    }
  });

  it('hash matches when re-hashed', () => {
    const { fullKey, hash } = generateApiKey();
    expect(hashKey(fullKey)).toBe(hash);
  });
});

describe('isValidKeyFormat', () => {
  it('accepts valid keys', () => {
    expect(isValidKeyFormat('sl_live_abc123456789012345')).toBe(true);
  });

  it('rejects keys without prefix', () => {
    expect(isValidKeyFormat('wrong_prefix_key')).toBe(false);
  });

  it('rejects too-short keys', () => {
    expect(isValidKeyFormat('sl_live_short')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidKeyFormat('')).toBe(false);
  });
});

describe('hashKey', () => {
  it('produces consistent hashes', () => {
    const key = 'sl_live_test_key_12345678';
    expect(hashKey(key)).toBe(hashKey(key));
  });

  it('produces different hashes for different keys', () => {
    expect(hashKey('sl_live_key_1')).not.toBe(hashKey('sl_live_key_2'));
  });
});

describe('hasScope', () => {
  it('returns true for included scope', () => {
    expect(hasScope('["read","write"]', 'read')).toBe(true);
    expect(hasScope('["read","write"]', 'write')).toBe(true);
  });

  it('returns false for missing scope', () => {
    expect(hasScope('["read"]', 'write')).toBe(false);
  });

  it('returns false for invalid JSON', () => {
    expect(hasScope('not-json', 'read')).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(hasScope('[]', 'read')).toBe(false);
  });
});

describe('validateScopes', () => {
  it('filters valid scopes', () => {
    expect(validateScopes(['read', 'write', 'admin'])).toEqual(['read', 'write']);
  });

  it('returns empty for all invalid', () => {
    expect(validateScopes(['admin', 'sudo'])).toEqual([]);
  });

  it('handles empty array', () => {
    expect(validateScopes([])).toEqual([]);
  });
});
