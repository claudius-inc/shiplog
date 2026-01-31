// ============================================================================
// Email Digest Templates — Beautiful HTML emails for changelog summaries
// ============================================================================

import type { ChangelogEntry, Category, Project } from './types';
import { groupEntriesByCategory, getCategoryLabel, formatDate } from './changelog';

// ============================================================================
// Types
// ============================================================================

export interface DigestData {
  project: Pick<Project, 'name' | 'slug'>;
  entries: ChangelogEntry[];
  period: { from: string; to: string };
  baseUrl: string;
  unsubscribeUrl: string;
}

// ============================================================================
// Color Palette (inline-safe — no Tailwind in emails)
// ============================================================================

const colors = {
  bg: '#0f172a',
  cardBg: '#1e293b',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  accent: '#818cf8',
  accentHover: '#6366f1',
  border: '#334155',
  feature: { bg: '#064e3b', text: '#6ee7b7', border: '#065f46' },
  fix: { bg: '#78350f', text: '#fcd34d', border: '#92400e' },
  improvement: { bg: '#1e3a5f', text: '#93c5fd', border: '#1e40af' },
  breaking: { bg: '#7f1d1d', text: '#fca5a5', border: '#991b1b' },
} as const;

const categoryColors: Record<Category, { bg: string; text: string; border: string }> = {
  feature: colors.feature,
  fix: colors.fix,
  improvement: colors.improvement,
  breaking: colors.breaking,
};

// ============================================================================
// Template Components
// ============================================================================

function categoryBadge(category: Category): string {
  const c = categoryColors[category];
  const label = getCategoryLabel(category);
  return `<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;background:${c.bg};color:${c.text};border:1px solid ${c.border};">${label}</span>`;
}

function entryRow(entry: ChangelogEntry): string {
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${colors.border};vertical-align:top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:32px;vertical-align:top;padding-right:12px;">
              <span style="font-size:20px;">${entry.emoji}</span>
            </td>
            <td>
              <p style="margin:0 0 6px;font-size:15px;color:${colors.text};line-height:1.5;">
                ${escapeHtml(entry.summary)}
              </p>
              <p style="margin:0;font-size:12px;color:${colors.textDim};">
                <a href="${entry.pr_url}" style="color:${colors.accent};text-decoration:none;">#${entry.pr_number}</a>
                &nbsp;by @${escapeHtml(entry.pr_author)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function categorySectionHtml(category: Category, entries: ChangelogEntry[]): string {
  if (entries.length === 0) return '';
  return `
    <tr>
      <td style="padding:20px 0 8px;">
        ${categoryBadge(category)}
      </td>
    </tr>
    ${entries.map(entryRow).join('')}`;
}

// ============================================================================
// Main Email Template
// ============================================================================

export function renderDigestEmail(data: DigestData): { html: string; text: string; subject: string } {
  const { project, entries, period, baseUrl, unsubscribeUrl } = data;
  const changelogUrl = `${baseUrl}/${project.slug}/changelog`;
  const fromDate = formatDate(period.from);
  const toDate = formatDate(period.to);

  const grouped = groupEntriesByCategory(entries);
  const stats = {
    total: entries.length,
    features: grouped.feature.length,
    fixes: grouped.fix.length,
    improvements: grouped.improvement.length,
    breaking: grouped.breaking.length,
  };

  const subject = `${project.name} — ${stats.total} update${stats.total !== 1 ? 's' : ''} this week`;

  // ====== HTML version ======
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]><style>body{font-family:Arial,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:${colors.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:${colors.bg};">
    ${stats.features ? `${stats.features} new feature${stats.features > 1 ? 's' : ''}, ` : ''}${stats.fixes ? `${stats.fixes} fix${stats.fixes > 1 ? 'es' : ''}, ` : ''}${stats.improvements ? `${stats.improvements} improvement${stats.improvements > 1 ? 's' : ''}` : ''}
  </div>

  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.bg};">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${colors.cardBg};border-radius:16px;border:1px solid ${colors.border};overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:${colors.textDim};">Changelog Digest</p>
                    <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;color:${colors.text};">${escapeHtml(project.name)}</h1>
                    <p style="margin:0;font-size:14px;color:${colors.textMuted};">${fromDate} — ${toDate}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Stats Bar -->
          <tr>
            <td style="padding:24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.bg};border-radius:12px;border:1px solid ${colors.border};">
                <tr>
                  ${stats.features > 0 ? `<td align="center" style="padding:16px 8px;"><span style="display:block;font-size:24px;font-weight:700;color:${colors.feature.text};">${stats.features}</span><span style="font-size:11px;color:${colors.textDim};text-transform:uppercase;letter-spacing:0.05em;">Features</span></td>` : ''}
                  ${stats.fixes > 0 ? `<td align="center" style="padding:16px 8px;"><span style="display:block;font-size:24px;font-weight:700;color:${colors.fix.text};">${stats.fixes}</span><span style="font-size:11px;color:${colors.textDim};text-transform:uppercase;letter-spacing:0.05em;">Fixes</span></td>` : ''}
                  ${stats.improvements > 0 ? `<td align="center" style="padding:16px 8px;"><span style="display:block;font-size:24px;font-weight:700;color:${colors.improvement.text};">${stats.improvements}</span><span style="font-size:11px;color:${colors.textDim};text-transform:uppercase;letter-spacing:0.05em;">Improvements</span></td>` : ''}
                  ${stats.breaking > 0 ? `<td align="center" style="padding:16px 8px;"><span style="display:block;font-size:24px;font-weight:700;color:${colors.breaking.text};">${stats.breaking}</span><span style="font-size:11px;color:${colors.textDim};text-transform:uppercase;letter-spacing:0.05em;">Breaking</span></td>` : ''}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Entries -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${(['breaking', 'feature', 'improvement', 'fix'] as Category[])
                  .map(c => categorySectionHtml(c, grouped[c]))
                  .join('')}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:8px 32px 32px;">
              <a href="${changelogUrl}" style="display:inline-block;padding:12px 28px;background:${colors.accent};color:#fff;text-decoration:none;font-weight:600;font-size:14px;border-radius:8px;">
                View Full Changelog →
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 32px;"><div style="height:1px;background:${colors.border};"></div></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0;font-size:12px;color:${colors.textDim};text-align:center;line-height:1.6;">
                Powered by <a href="${baseUrl}" style="color:${colors.accent};text-decoration:none;">ShipLog</a>
                &nbsp;·&nbsp;
                <a href="${unsubscribeUrl}" style="color:${colors.textDim};text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- End Card -->

      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  // ====== Plain-text version ======
  const textSections: string[] = [];
  textSections.push(`${project.name} — Changelog Digest`);
  textSections.push(`${fromDate} — ${toDate}`);
  textSections.push(`${stats.total} update${stats.total !== 1 ? 's' : ''}\n`);

  for (const category of ['breaking', 'feature', 'improvement', 'fix'] as Category[]) {
    const catEntries = grouped[category];
    if (catEntries.length === 0) continue;
    textSections.push(getCategoryLabel(category));
    for (const entry of catEntries) {
      textSections.push(`  ${entry.emoji} ${entry.summary} (#${entry.pr_number})`);
    }
    textSections.push('');
  }

  textSections.push(`Full changelog: ${changelogUrl}`);
  textSections.push(`Unsubscribe: ${unsubscribeUrl}`);

  return { html, text: textSections.join('\n'), subject };
}

// ============================================================================
// Welcome Email Template
// ============================================================================

export function renderWelcomeEmail(data: {
  projectName: string;
  changelogUrl: string;
  unsubscribeUrl: string;
  baseUrl: string;
}): { html: string; text: string; subject: string } {
  const subject = `You're subscribed to ${data.projectName} updates`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${colors.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.bg};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${colors.cardBg};border-radius:16px;border:1px solid ${colors.border};overflow:hidden;">
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:48px;">📬</p>
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${colors.text};">You're in!</h1>
              <p style="margin:0 0 24px;font-size:15px;color:${colors.textMuted};line-height:1.6;">
                You'll receive weekly digest emails for <strong style="color:${colors.text};">${escapeHtml(data.projectName)}</strong> — 
                a summary of all new features, bug fixes, and improvements.
              </p>
              <a href="${data.changelogUrl}" style="display:inline-block;padding:12px 28px;background:${colors.accent};color:#fff;text-decoration:none;font-weight:600;font-size:14px;border-radius:8px;">
                View Current Changelog →
              </a>
            </td>
          </tr>
          <tr><td style="padding:0 32px;"><div style="height:1px;background:${colors.border};"></div></td></tr>
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0;font-size:12px;color:${colors.textDim};text-align:center;">
                Powered by <a href="${data.baseUrl}" style="color:${colors.accent};text-decoration:none;">ShipLog</a>
                &nbsp;·&nbsp;
                <a href="${data.unsubscribeUrl}" style="color:${colors.textDim};text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = [
    `You're subscribed to ${data.projectName} updates!`,
    '',
    "You'll receive weekly digest emails with a summary of all new features, bug fixes, and improvements.",
    '',
    `View changelog: ${data.changelogUrl}`,
    `Unsubscribe: ${data.unsubscribeUrl}`,
  ].join('\n');

  return { html, text, subject };
}

// ============================================================================
// Helpers
// ============================================================================

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
