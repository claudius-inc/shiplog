# ShipLog — TODO

## Phase 2: Make It Work End-to-End
- [x] Verify all API routes compile and run without errors
- [x] Set up SQLite database initialization on first run
- [x] Migrate database layer from better-sqlite3 to @libsql/client (Vercel-compatible)
- [x] Build the public changelog page with real rendered entries
- [x] Add RSS feed endpoint
- [x] Landing page with clear value prop and "Connect GitHub" CTA
- [ ] Test GitHub OAuth flow end-to-end (needs deployed env)
- [ ] Test PR fetch → AI categorization → changelog entry pipeline (needs deployed env)

## Phase 3: Deploy & Launch
- [ ] Create Turso database for production (script ready — needs Turso account)
- [ ] Deploy to Vercel (script ready — needs Vercel account)
- [ ] Create GitHub OAuth App for production (callback URL needs Vercel domain)
- [ ] Set up custom domain (shiplog.dev or similar)
- [ ] Test OAuth + sync pipeline on live deployment
- [x] Write launch post for Reddit (r/SideProject, r/webdev) — see launch/
- [x] Write Product Hunt launch copy — see launch/producthunt-copy.md
- [x] Write Show HN post — see launch/hackernews-showhn.md
- [x] Create one-command deployment script — scripts/deploy.sh
- [x] Create deployment guide — DEPLOY.md
- [ ] Post in relevant Discord communities

## Phase 3.5: Polish
- [x] Embeddable changelog widget (JS + JSON API + dashboard embed code)
- [x] Email digest system (templates, subscriber mgmt, provider abstraction, API routes, dashboard settings)
- [x] Custom branding options (logo, colors, live preview, embed support)
- [x] Changelog search (debounced LIKE search with result UI)
- [x] SEO: JSON-LD structured data, sitemap.xml, robots.txt, PWA manifest, page metadata
- [x] Error handling: global + dashboard error boundaries, 404 page, loading states

## Phase 4: Monetize
- [x] Add Stripe integration for paid tiers (checkout, webhooks, portal, status API)
- [x] Free tier: public repos only (enforcement in projects API)
- [x] Widget embed (done — included in base, premium features in paid)
- [x] Pro tier ($9/mo): private repos, custom domain, email digests (tiers defined, gates enforced)
- [x] Team tier ($29/mo): multiple users, branded widget, priority support (tiers defined)
- [x] Dashboard billing page (/dashboard/billing)
- [x] Feature gate enforcement (branding, digest, private repos, project limits)
- [x] UpgradePrompt component for locked features
- [ ] Create Stripe products/prices (needs Stripe account — blocked on credentials)
- [ ] End-to-end billing test on live deployment
