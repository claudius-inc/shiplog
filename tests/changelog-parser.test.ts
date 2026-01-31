// ============================================================================
// Tests for changelog-parser.ts
// ============================================================================

import { describe, it, expect } from 'vitest';
import { parseChangelog, parseGitHubReleases } from '../src/lib/changelog-parser';

describe('parseChangelog — Keep a Changelog format', () => {
  it('parses a standard Keep a Changelog file', () => {
    const md = `# Changelog

## [1.2.0] - 2024-01-15
### Added
- New dashboard UI
- Dark mode support

### Fixed
- Login timeout bug
- Memory leak in worker

### Changed
- Improved search performance

## [1.1.0] - 2024-01-01
### Added
- User profiles

### Removed
- Legacy API endpoints
`;

    const result = parseChangelog(md);
    expect(result.entries).toHaveLength(7);
    expect(result.warnings).toHaveLength(0);

    // Check first entry
    expect(result.entries[0]).toEqual({
      version: '1.2.0',
      date: '2024-01-15',
      category: 'feature',
      summary: 'New dashboard UI',
      emoji: '✨',
    });

    // Check fix
    expect(result.entries[2].category).toBe('fix');
    expect(result.entries[2].emoji).toBe('🐛');

    // Check improvement (Changed)
    expect(result.entries[4].category).toBe('improvement');

    // Check breaking (Removed)
    expect(result.entries[6].category).toBe('breaking');
    expect(result.entries[6].version).toBe('1.1.0');
  });

  it('handles version without date', () => {
    const md = `## [2.0.0]
### Breaking Changes
- Dropped Node 14 support
`;
    const result = parseChangelog(md);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].version).toBe('2.0.0');
    expect(result.entries[0].date).toBeNull();
    expect(result.entries[0].category).toBe('breaking');
  });

  it('handles v-prefixed versions', () => {
    const md = `## [v3.1.0] - 2024-06-01
### Added
- Feature X
`;
    const result = parseChangelog(md);
    expect(result.entries[0].version).toBe('3.1.0');
  });

  it('strips PR references and markdown links', () => {
    const md = `## [1.0.0] - 2024-01-01
### Fixed
- Fix crash in \`Parser\` component (#123)
- Resolve [issue](https://github.com/org/repo/issues/42)
`;
    const result = parseChangelog(md);
    expect(result.entries[0].summary).toBe('Fix crash in Parser component');
    expect(result.entries[1].summary).toBe('Resolve issue');
  });

  it('handles Security section', () => {
    const md = `## [1.0.1] - 2024-02-01
### Security
- Patched XSS vulnerability
`;
    const result = parseChangelog(md);
    expect(result.entries[0].category).toBe('fix');
    expect(result.entries[0].emoji).toBe('🔒');
  });

  it('handles Deprecated section', () => {
    const md = `## [2.0.0] - 2024-03-01
### Deprecated
- Old API v1 endpoints
`;
    const result = parseChangelog(md);
    expect(result.entries[0].category).toBe('improvement');
    expect(result.entries[0].emoji).toBe('⚠️');
  });

  it('warns on unknown sections', () => {
    const md = `## [1.0.0] - 2024-01-01
### Miscellaneous
- Something odd
`;
    const result = parseChangelog(md);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('Unknown section');
  });

  it('returns warning when no entries found', () => {
    const result = parseChangelog('Just some random text\nwith no changelog format');
    expect(result.entries).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('normalizes dates with slashes', () => {
    const md = `## [1.0.0] - 2024/1/5
### Added
- Something
`;
    const result = parseChangelog(md);
    expect(result.entries[0].date).toBe('2024-01-05');
  });

  it('handles list items with different markers', () => {
    const md = `## [1.0.0] - 2024-01-01
### Added
- Dash item
* Star item
+ Plus item
`;
    const result = parseChangelog(md);
    expect(result.entries).toHaveLength(3);
  });

  it('infers category from content when no section header', () => {
    const md = `## [1.0.0] - 2024-01-01
- Added new dashboard
- Fixed login crash
- Removed old API
- Updated dependencies
`;
    const result = parseChangelog(md);
    expect(result.entries).toHaveLength(4);
    expect(result.entries[0].category).toBe('feature'); // "Added"
    expect(result.entries[1].category).toBe('fix'); // "Fixed"
    expect(result.entries[2].category).toBe('breaking'); // "Removed"
    expect(result.entries[3].category).toBe('improvement'); // default
  });

  it('handles semver with pre-release suffix', () => {
    const md = `## [2.0.0-beta.1] - 2024-01-01
### Added
- Beta feature
`;
    const result = parseChangelog(md);
    expect(result.entries[0].version).toBe('2.0.0-beta.1');
  });

  it('skips link references at bottom of file', () => {
    const md = `## [1.0.0] - 2024-01-01
### Added
- Feature X

[1.0.0]: https://github.com/org/repo/compare/v0.9.0...v1.0.0
`;
    const result = parseChangelog(md);
    expect(result.entries).toHaveLength(1);
  });

  it('handles large changelogs efficiently', () => {
    let md = '# Changelog\n\n';
    for (let v = 100; v > 0; v--) {
      md += `## [1.${v}.0] - 2024-01-${String(v % 28 + 1).padStart(2, '0')}\n`;
      md += '### Added\n- Feature\n### Fixed\n- Bug\n\n';
    }
    const result = parseChangelog(md);
    expect(result.entries).toHaveLength(200); // 100 versions × 2 entries
  });
});

describe('parseGitHubReleases', () => {
  it('parses release notes without section headers', () => {
    const md = `## v2.0.0

- Added new auth system
- Fixed memory leak
- Improved query performance

## v1.9.0

- Added dark mode
`;
    const result = parseGitHubReleases(md);
    expect(result.entries).toHaveLength(4);
    expect(result.entries[0].version).toBe('2.0.0');
    expect(result.entries[0].category).toBe('feature'); // "Added"
    expect(result.entries[1].category).toBe('fix'); // "Fixed"
  });
});
