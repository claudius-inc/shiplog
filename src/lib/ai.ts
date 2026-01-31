// ============================================================================
// AI Categorization Service — OpenAI
// ============================================================================

import OpenAI from 'openai';
import type { AICategorization, Category } from './types';

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

const SYSTEM_PROMPT = `You are a changelog assistant for a software project. Your job is to categorize pull requests and write concise, user-friendly summaries.

Given a PR title, description, and optional diff summary, you must:
1. Categorize it as one of: feature, fix, improvement, breaking
2. Write a clear, concise summary (1-2 sentences max) that a non-technical user could understand
3. Choose an appropriate emoji

Categories:
- feature: New functionality, new capabilities, new integrations
- fix: Bug fixes, error corrections, crash fixes
- improvement: Performance improvements, refactors, UX enhancements, documentation updates
- breaking: Breaking changes, API changes, deprecations, major version bumps

Rules:
- Keep summaries under 100 words
- Use active voice ("Added dark mode" not "Dark mode was added")
- Focus on user impact, not implementation details
- Don't mention PR numbers or technical jargon unless necessary

Respond in JSON format:
{
  "category": "feature|fix|improvement|breaking",
  "summary": "Your concise summary here",
  "emoji": "appropriate emoji"
}`;

export async function categorizePR(data: {
  title: string;
  body: string | null;
  diff?: string;
}): Promise<AICategorization> {
  try {
    const userMessage = buildUserMessage(data);

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty AI response');
    }

    const result = JSON.parse(content);
    return validateCategorization(result);
  } catch (error) {
    console.error('AI categorization failed, using fallback:', error);
    return fallbackCategorization(data.title);
  }
}

function buildUserMessage(data: { title: string; body: string | null; diff?: string }): string {
  let message = `PR Title: ${data.title}\n`;

  if (data.body) {
    // Truncate body to keep tokens reasonable
    const body = data.body.slice(0, 2000);
    message += `\nPR Description:\n${body}\n`;
  }

  if (data.diff) {
    const diff = data.diff.slice(0, 3000);
    message += `\nDiff Summary:\n${diff}\n`;
  }

  return message;
}

function validateCategorization(result: Record<string, unknown>): AICategorization {
  const validCategories: Category[] = ['feature', 'fix', 'improvement', 'breaking'];
  const category = validCategories.includes(result.category as Category)
    ? (result.category as Category)
    : 'improvement';

  return {
    category,
    summary: typeof result.summary === 'string' ? result.summary : 'Updated the project.',
    emoji: typeof result.emoji === 'string' ? result.emoji : getCategoryEmoji(category),
  };
}

// ============================================================================
// Fallback — keyword-based categorization when AI is unavailable
// ============================================================================

export function fallbackCategorization(title: string): AICategorization {
  const lower = title.toLowerCase();

  if (lower.match(/\b(break|breaking|deprecat|remov|migration)\b/)) {
    return { category: 'breaking', summary: title, emoji: '⚠️' };
  }

  if (lower.match(/\b(fix|bug|patch|hotfix|resolve|issue|error|crash)\b/)) {
    return { category: 'fix', summary: title, emoji: '🐛' };
  }

  if (lower.match(/\b(feat|add|new|implement|introduc|create|launch)\b/)) {
    return { category: 'feature', summary: title, emoji: '✨' };
  }

  return { category: 'improvement', summary: title, emoji: '💅' };
}

function getCategoryEmoji(category: Category): string {
  const emojiMap: Record<Category, string> = {
    feature: '✨',
    fix: '🐛',
    improvement: '💅',
    breaking: '⚠️',
  };
  return emojiMap[category];
}

export async function categorizeBatch(
  prs: Array<{ title: string; body: string | null; diff?: string }>
): Promise<AICategorization[]> {
  // Process in parallel with concurrency limit
  const BATCH_SIZE = 5;
  const results: AICategorization[] = [];

  for (let i = 0; i < prs.length; i += BATCH_SIZE) {
    const batch = prs.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(categorizePR));
    results.push(...batchResults);
  }

  return results;
}
