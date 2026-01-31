import { describe, it, expect } from 'vitest';
import { fallbackCategorization } from '../ai';

// ============================================================================
// Fallback Categorization (keyword-based, no API needed)
// ============================================================================

describe('fallbackCategorization', () => {
  describe('breaking changes', () => {
    it('detects "breaking" keyword', () => {
      expect(fallbackCategorization('Breaking: remove v1 API').category).toBe('breaking');
    });

    it('detects "deprecat" keyword', () => {
      expect(fallbackCategorization('Deprecate old auth flow').category).toBe('breaking');
    });

    it('detects "migration" keyword', () => {
      expect(fallbackCategorization('Database migration to v3').category).toBe('breaking');
    });

    it('uses ⚠️ emoji', () => {
      expect(fallbackCategorization('Remove legacy endpoint').emoji).toBe('⚠️');
    });
  });

  describe('bug fixes', () => {
    it('detects "fix" keyword', () => {
      expect(fallbackCategorization('Fix login redirect loop').category).toBe('fix');
    });

    it('detects "bug" keyword', () => {
      expect(fallbackCategorization('Bug in date parsing').category).toBe('fix');
    });

    it('detects "hotfix" keyword', () => {
      expect(fallbackCategorization('Hotfix for production crash').category).toBe('fix');
    });

    it('detects "crash" keyword', () => {
      expect(fallbackCategorization('App crash on empty state').category).toBe('fix');
    });

    it('uses 🐛 emoji', () => {
      expect(fallbackCategorization('Fix typo in config').emoji).toBe('🐛');
    });
  });

  describe('features', () => {
    it('detects "feat" keyword', () => {
      expect(fallbackCategorization('feat: add dark mode').category).toBe('feature');
    });

    it('detects "add" keyword', () => {
      expect(fallbackCategorization('Add email notifications').category).toBe('feature');
    });

    it('detects "new" keyword', () => {
      expect(fallbackCategorization('New dashboard layout').category).toBe('feature');
    });

    it('detects "implement" keyword', () => {
      expect(fallbackCategorization('Implement OAuth flow').category).toBe('feature');
    });

    it('detects "create" keyword', () => {
      expect(fallbackCategorization('Create user settings page').category).toBe('feature');
    });

    it('uses ✨ emoji', () => {
      expect(fallbackCategorization('Add search feature').emoji).toBe('✨');
    });
  });

  describe('improvements (default)', () => {
    it('falls back to improvement for unmatched titles', () => {
      expect(fallbackCategorization('Refactor auth module').category).toBe('improvement');
    });

    it('uses 💅 emoji for improvements', () => {
      expect(fallbackCategorization('Update dependencies').emoji).toBe('💅');
    });

    it('handles empty title', () => {
      const result = fallbackCategorization('');
      expect(result.category).toBe('improvement');
      expect(result.emoji).toBe('💅');
    });
  });

  describe('priority: breaking > fix > feature > improvement', () => {
    it('breaking wins over fix keywords', () => {
      // "remove" matches breaking
      expect(fallbackCategorization('Remove broken fix endpoint').category).toBe('breaking');
    });

    it('fix wins over feature keywords', () => {
      // "fix" checked before "add"
      expect(fallbackCategorization('Fix: add missing null check').category).toBe('fix');
    });
  });

  it('uses PR title as summary', () => {
    const title = 'Add dark mode support';
    expect(fallbackCategorization(title).summary).toBe(title);
  });
});
