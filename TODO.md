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
- [ ] Create Turso database for production
- [ ] Deploy to Vercel
- [ ] Create GitHub OAuth App for production (callback URL needs Vercel domain)
- [ ] Set up custom domain (shiplog.dev or similar)
- [ ] Test OAuth + sync pipeline on live deployment
- [ ] Write launch post for Reddit (r/SideProject, r/webdev)
- [ ] Submit to Product Hunt
- [ ] Post in relevant Discord communities

## Phase 3.5: Polish
- [x] Embeddable changelog widget (JS + JSON API + dashboard embed code)
- [x] Email digest system (templates, subscriber mgmt, provider abstraction, API routes, dashboard settings)
- [x] Custom branding options (logo, colors, live preview, embed support)
- [x] Changelog search (debounced LIKE search with result UI)

## Phase 4: Monetize
- [ ] Add Stripe integration for paid tiers
- [ ] Free tier: public repos only
- [x] Widget embed (done — included in base, premium features in paid)
- [ ] Pro tier ($9/mo): private repos, custom domain, email digests
- [ ] Team tier ($29/mo): multiple users, branded widget, priority support
