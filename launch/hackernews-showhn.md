# Hacker News — Show HN

**Title:** Show HN: ShipLog – Auto-generate changelogs from your GitHub PRs

**Body:**

ShipLog connects to your GitHub repos via OAuth and webhooks, reads merged PRs, and generates a public changelog page automatically.

It uses GPT-4o-mini to categorize each PR (feature/fix/improvement/breaking) and write a one-line user-facing summary. The public changelog page is searchable, has RSS, and supports custom branding.

Also built an embeddable widget (single script tag, shadow DOM, cross-origin safe) and an email digest system for subscribers.

Stack: Next.js 14, Turso (libSQL), Tailwind, OpenAI. Deployed on Vercel.

Free tier: public repos, all features. Pro (coming): private repos, custom domains, teams.

https://shiplog-coral.vercel.app
