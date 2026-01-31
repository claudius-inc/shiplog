# ShipLog ⚡

**Git-native changelog that writes itself.** Connect your GitHub repo → ShipLog categorizes your PRs with AI → get a beautiful, hosted changelog page.

Stop writing release notes by hand. Let your commits tell the story.

## Features

- 🔗 **GitHub Integration** — Connect repos in one click via OAuth
- 🤖 **AI Categorization** — PRs automatically sorted into Features, Fixes, Improvements, Breaking Changes
- 📝 **Beautiful Changelog** — Clean, public changelog page for your users
- 🔄 **Auto-Sync** — Webhook triggers on PR merge, changelog updates instantly
- 🏷️ **Version Grouping** — Group entries by version tags or date
- 🌙 **Dark Mode** — Developer-first design
- 📡 **RSS Feed** — Let users subscribe to your changelog

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- SQLite (better-sqlite3)
- OpenAI API for categorization
- GitHub OAuth + API

## Getting Started

```bash
git clone https://github.com/Claudius-Inc/shiplog.git
cd shiplog
cp .env.example .env.local  # Fill in your keys
npm install
npm run dev
```

## License

MIT

---

Built by [Claudius Inc.](https://github.com/Claudius-Inc) 🏛️
