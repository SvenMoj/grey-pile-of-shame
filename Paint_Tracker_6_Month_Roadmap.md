# Paint Tracker — 6-Month Roadmap to Public Launch

**Owner:** Sven · **Horizon:** Month 0 → Month 6 public launch · **Audience:** EU-first, EN + DE

> **Read this with the v0.1 plan.** This document is the broader 6-month picture. The focused, week-by-week plan for the conversion-engine MVP (months 1-3) lives in `Paint_Tracker_v0.1_MVP_Plan.md`. Use that for the immediate-term execution; use this for the post-MVP shape.

---

## The bet, in one paragraph

The Warhammer/miniature paint tracking category has roughly fifteen apps and one structural problem: every existing player has stale data and no real cross-brand conversion engine. The wedge is a trustworthy conversion lookup, seeded with manually curated data and grown by community contributions in the spirit of long-lived hobby archives like the Golden Demon Compendium — community-first, sustainable for a decade, with revenue as a quiet byproduct rather than the center of gravity. Ship it as a PWA on web (with an Android TWA wrapper for Play Store presence), launch EN+DE EU-first, fund hosting via Patreon, layer on retailer affiliate revenue, and reach defensibility through database curation rather than features. Six months from day zero to a public launch beyond the conversion-engine MVP — but the real horizon is five-to-ten years of patient compounding, not a sprint.

## Operating principles

These hold across all six months. Re-read them whenever a decision feels hard.

**The database is the product.** Features are easy and replaceable. A trustworthy, fresh, multi-brand paint catalog with crowd-verified conversions is the moat. Whenever an investment trade-off appears, choose the data-curation side.

**Community first, revenue second.** The Compendium maintainer has thirteen Patreon supporters after ten years of dedicated work and is one of the most respected hobby archivists in the community. That's the model. Treat affiliate income and any future premium tier as the cherry on top of a project that exists to serve painters. The moment monetization compromises the community gift, you've lost the long game.

**Build it like you'll still be here in 2036.** This is a decade-arc project, not a six-month sprint. Decisions that feel correct under that timeline (slow, careful, durable) will sometimes feel wrong under a six-month one. Trust the decade.

**Ship something every week.** Even in months heavy on infrastructure, push at least one visible improvement weekly. Painters need to see the project moving. A silent month kills trust.

**Talk to five painters every two weeks.** You're already in the community — use that. DACH hobby Discords, Tabletopwelt, local clubs, Spiel Essen. Ask three concrete questions and listen. Without this, you'll build the wrong product confidently.

**Privacy-first by default.** EU launch means DSGVO is non-negotiable. Data export, deletion flow, EU hosting, minimal third-party trackers, transparent privacy policy from day one. Treat it as a feature, not a compliance cost.

**Don't build for native until you have to.** PWA + Android TWA covers ~70% of EU mobile. iOS native is a year-three problem at the earliest.

**Be wary of AI for AI's sake.** Cross-brand conversion does not need AI. Inventory does not need AI. Recipes do not need AI. If an AI feature genuinely earns its place (photo-of-mini-to-paint-suggestion is the closest candidate), ship it as an experiment in year two — not as a launch feature. The wedge holds without AI varnish.

---

## Tech stack (decisions to lock in week 1)

- **Frontend / app:** Next.js 15 (App Router) + TypeScript + Tailwind, hosted on Vercel. PWA via `next-pwa` or `@serwist/next`.
- **Backend / data:** Supabase Frankfurt region (Postgres + Auth + Storage + Realtime). Stays in the EU for DSGVO.
- **Storage for images:** Cloudflare R2 (cheap egress, EU-hosted).
- **Email:** Resend (transactional) or SendGrid. EU residency check before signing.
- **Analytics:** Plausible (EU-hosted, cookieless, DSGVO-friendly out of the box).
- **Error tracking:** Sentry (self-hosted or EU instance).
- **Payments:** Stripe (subscription + one-time products). Handles EU VAT via Stripe Tax.
- **AI features:** Anthropic Claude (vision for shelf scan and color extraction). Cap usage on free tier.
- **Android app:** Bubblewrap CLI to wrap the PWA as a TWA, submit to Play Store. No native code.
- **Repo / CI:** GitHub + Vercel auto-deploys. Branch previews for every PR.
- **Domain:** Pick early. Something pronounceable in both EN and DE. Avoid "Paint" + "Track" / "Rack" since those are taken.

---

## Month 1 — Foundation & the public conversion engine

**Theme:** Get a free, useful, public web tool live. No accounts, no inventory yet — just the conversion engine, working, on a domain.

**Why this first:** It's the lowest-friction proof of value. It establishes the brand and SEO surface area before you ask anyone to sign up. Every conversion page is an indexable landing page that pulls organic traffic for years.

### Features

**1.1 — Anonymous conversion lookup (public)**
- *Scope:* Search box, pick a paint from any of the four big brands (Citadel, Vallejo, Army Painter Fanatic, Scale75), see equivalents in the other three with confidence indicators and hex/LAB values.
- *Effort:* 1 week
- *Dependencies:* Seeded conversion dataset (see below)
- *Success criteria:* User can complete a lookup in under 10 seconds without signing up; result feels authoritative.

**1.2 — Paint catalog browse pages (SEO surface)**
- *Scope:* Static-generated page per paint: `/paints/citadel/mephiston-red` with name, hex, LAB, conversions, hobbyist notes. Indexable in Google.
- *Effort:* 3-4 days (template + generation pipeline)
- *Dependencies:* Catalog seeded
- *Success criteria:* Google indexes at least 200 paint pages by end of month; "Mephiston Red Vallejo" returns your page in top 10 within 6 weeks.

**1.3 — Brand & visual identity**
- *Scope:* Name, logo, color palette, basic landing page copy, EN+DE versions. Keep it minimal but not generic — design-aware, not designer-tier.
- *Effort:* 1 week (in parallel with code)
- *Dependencies:* None
- *Success criteria:* You can look at the homepage and not flinch.

**1.4 — DSGVO baseline**
- *Scope:* Privacy policy, imprint (Impressum required under German law), cookie banner (only if you set non-essential cookies — try to ship without them), data export endpoint, account deletion flow even though there's no account yet.
- *Effort:* 3-4 days (Iubenda or similar generator for policy; lawyer review later)
- *Dependencies:* Hosting region locked
- *Success criteria:* A DACH user could land on the site and not see a compliance red flag.

### Community / growth activity

- **Seed 400 high-quality conversions manually.** This is the unsexy core of month 1. Cross-reference: the Citadel Colour App, Vallejo's official conversion chart, Army Painter's Warpaints app, community Google Sheets (Goonhammer, Tale of Painters), and side-by-side photo evidence from Reddit threads. Two to three weeks of evening work. Don't skip this. An empty database kills the launch.
- Set up a public changelog page (`/changelog`). Post weekly even if minor.
- Reserve handles on Reddit, Bluesky, Instagram, Mastodon. Don't post yet.

### Monetization status

- Not active yet. The site is free and account-less.
- Decide on pricing in principle (recommended: €4.99/mo or €39/yr subscription, €19 one-time unlock for users who refuse subs) so all later UX assumes it.

### Key decisions to make this month

- **Name and domain.** Don't agonize past two weeks. Pick something, register it, move on.
- **EN-only or EN+DE at launch?** Recommend EN+DE from day one — translation overhead is modest if you architect for it; retrofit is painful.
- **Open source or proprietary?** Recommend proprietary core, but open-source the paint database itself (or at least the conversion mappings) under a permissive license. This builds community goodwill and protects against a competitor scraping your data anyway.

---

## Month 2 — Accounts, inventory, closed beta

**Theme:** Turn the public tool into a product that remembers you. Invite 20-30 painters to private beta.

### Features

**2.1 — Authentication**
- *Scope:* Magic-link email login as primary, optional Google sign-in. No password creation. Account deletion in settings.
- *Effort:* 2-3 days (Supabase Auth handles most of this)
- *Dependencies:* Email service live
- *Success criteria:* Sign-in to completed session in under 30 seconds.

**2.2 — Inventory CRUD**
- *Scope:* Add a paint to your inventory from the catalog with one tap. Three states: owned, wishlist, running-low. Filter and sort. Multi-select.
- *Effort:* 1 week
- *Dependencies:* Auth, catalog
- *Success criteria:* A new user can build an inventory of 50 paints in under 15 minutes.

**2.3 — Custom paint add**
- *Scope:* Big "+ Add custom paint" button accessible everywhere. Name, brand (free text or pick), hex (color picker), size, notes. Never paywalled.
- *Effort:* 2-3 days
- *Dependencies:* Inventory schema
- *Success criteria:* User can add a paint not in your catalog in under 60 seconds.

**2.4 — Cloud sync foundation**
- *Scope:* All inventory data lives in Supabase, fetched on login. IndexedDB caches for instant load and offline-resilience. Conflict resolution: server wins on simultaneous writes.
- *Effort:* 1 week (the conflict logic is the hard part)
- *Dependencies:* Auth, inventory
- *Success criteria:* Add a paint on phone, see it on laptop within seconds.

**2.5 — Lightweight project tracker**
- *Scope:* Create a project ("Death Guard 2000pt"), assign paints to it, mark progress (planned / in progress / complete). Don't over-build — this is opt-in for the project-tracking minority.
- *Effort:* 4-5 days
- *Dependencies:* Inventory
- *Success criteria:* User can create a project and link 10 paints in under 5 minutes.

### Community / growth activity

- **Recruit 20-30 beta painters.** Mix: 10 from r/minipainting (DM users who post collection photos), 5-10 from DACH hobby Discords (Tabletopwelt Discord, Brückenkopf, Spielmaterial), 5 from non-Citadel painters specifically (Vallejo and AP heavies — they care most about conversion).
- Private feedback channel: a Discord server, locked to beta painters, daily presence from you.
- Weekly office-hours-style call (optional, recorded with permission). Three painters showing up is fine.
- Begin documenting "verbatim painter quotes" for the eventual launch landing page.

### Monetization status

- Still free. No payment integration yet.
- Track which features users ask for repeatedly — these become the premium tier signals.

### Key decisions to make this month

- **What's free forever vs. premium?** Recommended split: free = inventory up to 200 paints, single device sync, basic project tracker, all conversion lookups, single project; premium = unlimited paints, unlimited devices, AI shelf scan, unlimited projects, recipe library, CSV export, retailer price alerts.
- **Closed beta NDA or open?** Recommend "soft beta" with no NDA — painters will share screenshots regardless, and the buzz benefits you.

---

## Month 3 — Community-driven content & PWA polish

**Theme:** Turn the database from "Sven's manual curation" into "the community keeps it alive." Make the PWA feel like a real app on Android.

### Features

**3.1 — User-submitted conversions**
- *Scope:* Logged-in user can submit a conversion (Paint A in Brand X → Paint B in Brand Y) with optional photo-pair evidence. Submission enters a pending queue.
- *Effort:* 4-5 days
- *Dependencies:* Auth, image storage
- *Success criteria:* A painter can submit a conversion in under 90 seconds; submission appears in queue immediately.

**3.2 — Voting and confidence scoring**
- *Scope:* Conversions display a confidence score derived from: number of confirming votes, contributor reputation, photo-pair presence, age. Users can upvote/downvote on the conversion page. Three-state display: "verified" (high score), "suggested" (medium), "single submission" (low).
- *Effort:* 1 week
- *Dependencies:* User submissions live
- *Success criteria:* Conversion pages clearly distinguish trusted from speculative mappings; users intuitively understand the score.

**3.3 — Contributor reputation & badges**
- *Scope:* User profile shows count of submissions, verified-rate, badge for ≥10/50/100 verified contributions. Public profile URL (`/painters/[username]`). Optional Reddit/Instagram handle for cross-link.
- *Effort:* 3-4 days
- *Dependencies:* Submissions, voting
- *Success criteria:* At least 3 beta painters voluntarily share their contributor profile to a hobby community.

**3.4 — PWA install flow**
- *Scope:* Service worker for offline catalog access. "Add to Home Screen" prompt shown after the user completes their 2nd successful conversion lookup (not before). Custom install UI for Android (where it shipped first) and iOS (with Safari-specific instructions).
- *Effort:* 4-5 days
- *Dependencies:* Stable web app
- *Success criteria:* 20%+ of returning users install the PWA within their first week.

**3.5 — German localization (full)**
- *Scope:* Complete EN→DE translation of UI strings, error messages, marketing pages. Translation files in JSON, structure ready for FR/PL later. Date/number formatting locale-aware.
- *Effort:* 1 week (parallel with development; can outsource translation review for €200-400)
- *Dependencies:* UI mostly stable
- *Success criteria:* A German painter can use the app end-to-end without seeing an English word.

### Community / growth activity

- Open beta. Move from 30 → 200 painters. Post in r/minipainting ("I built a paint conversion tool, looking for testers") and Tabletopwelt forum. Don't over-promise.
- Start a weekly newsletter (3 paragraphs max): what shipped, what's coming, one community spotlight. Resend free tier handles 3,000 contacts.
- First **r/minipainting weekly thread participation** — answer conversion questions with the app as proof.
- DM 5 mid-tier YouTube creators (50-200k subs, German channels prioritized: Modellbahn-Berni, Brückenkopf, plus EN: Tabletop Minions, Ninjon). Offer free premium for life if they review honestly. No expectations.

### Monetization status

- Build the Stripe integration this month, but don't enable purchases yet. Premium features exist but say "coming soon."
- Set up Brückenkopf-Online affiliate account, Fantasywelt, Amazon Associates (DE program).

### Key decisions to make this month

- **Submission quality control:** how strict on the first submission? Recommend: photo-pair required for "verified" status, but plain text submissions allowed for "suggested" tier. Lowers barrier without lowering trust.
- **Public profiles default to private or public?** Recommend public-by-default with easy toggle. Hobbyists like being seen.

---

## Month 4 — Barcodes, recipes, the in-store moment

**Theme:** Ship the boring features that actually drive daily use. Barcode scan for fast inventory addition and the in-store "did I already buy this?" check. Recipe library filtered by paints you own. No AI; the wedge holds without it.

### Features

**4.1 — Camera capture flow (Web Camera API)**
- *Scope:* "Scan" button accessible from inventory and home. Requests camera permission, shows preview, captures still image. Works in Chrome Android and Safari iOS (with known limitations).
- *Effort:* 4-5 days
- *Dependencies:* HTTPS (Vercel handles), modern browser
- *Success criteria:* Camera capture works on Android Chrome and iOS Safari without dev tools tweaks.

**4.2 — Barcode scanning + unknown-barcode capture loop**
- *Scope:* User points camera at paint pot barcode → app reads barcode (using `@zxing/browser` or QuaggaJS) → if matched in DB, adds to inventory; if unmatched, prompts "We don't have this barcode yet — add the paint to help others." User picks paint from catalog, barcode is stored, contributor gets a badge.
- *Effort:* 1 week
- *Dependencies:* Camera flow, contribution system
- *Success criteria:* In a beta-painter blind test, ≥80% of Citadel and Vallejo pot barcodes scan correctly on first attempt; unknown barcodes captured at ≥30%.

**4.3 — Recipe library (read-only first)**
- *Scope:* Browse community-uploaded recipes. Each recipe = title, mini description, list of layers with paints (in any brand). Filter: "show only recipes I can paint with what I own." Image attachments. Vote and bookmark.
- *Effort:* 1 week
- *Dependencies:* User accounts, image storage
- *Success criteria:* User can find a usable recipe for "Death Guard skin" filtered to their inventory in under 90 seconds.

**4.4 — Recipe submission flow**
- *Scope:* Users can submit their own recipes. Same submission/vote/confidence pattern as conversions.
- *Effort:* 4-5 days
- *Dependencies:* Recipe library
- *Success criteria:* 5 beta painters submit a recipe in the first week it's live.

**4.5 — Bulk paint add (the manual answer to "AI shelf scan")**
- *Scope:* "Add many paints at once" flow. Type-ahead search, multi-select from results, add all in one action. Much less glamorous than AI shelf scan, but actually faster and works perfectly. The unsexy answer to a sexy problem.
- *Effort:* 3-4 days
- *Dependencies:* Inventory CRUD
- *Success criteria:* User can add 30 paints to their inventory in under 5 minutes.

### Community / growth activity

- The shareable moment this month is the **recipe filter** — "the app shows me recipes I can paint with paints I already own" — which is genuinely novel. Pre-record a 60-second demo. Post to r/minipainting and Tabletopwelt the day it ships.
- Beta painter count target: 500.
- First media outreach: pitch Goonhammer, Tale of Painters, and Brückenkopf for a "tool spotlight" piece. Lead with the conversion engine demo plus the recipe filter.

### Monetization status

- Affiliate links go live in the UI ("Buy these paints: [Brückenkopf] [Fantasywelt] [Amazon DE]") on wishlist and project pages. Transparent disclosure in the about page.
- Patreon page goes live, framed as cost-coverage (hosting + database tooling). Public goals: €100/mo = hosting covered, €300/mo = "I can dedicate a full weekend day to this every week," €1,000/mo = "convention attendance funded."
- No premium subscription tier yet — defer until month 9-10 if at all.

### Key decisions to make this month

- **Patreon-first or freemium-first?** Recommend Patreon-first to start. It signals "community gift, support if you can" rather than "freemium upsell" — much more aligned with the Compendium-style sensibility. A modest premium tier can be added in year two if Patreon doesn't cover costs.
- **Recipe sharing scope:** allow YouTube/Instagram link embedding from day one. Painters already share recipes via video — meet them where they are rather than asking them to retype tutorials.

---

## Month 5 — Patreon, Android Play Store, polish

**Theme:** Activate the Patreon revenue line. Get on the Play Store. Fix everything painful before public launch.

### Features

**5.1 — Patreon integration**
- *Scope:* "Support on Patreon" prominent on the about page and in settings. Patreon-linked contributors get a public badge on their profile, a "Supporter" tag next to their submissions, and (optional) name listed on a public supporters page. No functional gating — purely social recognition.
- *Effort:* 2-3 days
- *Dependencies:* Patreon account, OAuth flow
- *Success criteria:* A user can connect Patreon and see their badge in under 60 seconds. First 5 supporters by end of month.

**5.2 — Affiliate revenue UI**
- *Scope:* "Where to buy" buttons appear on paint pages and project shopping lists. Auto-routes EU users to Brückenkopf / Fantasywelt; UK to Element Games; everywhere else to Amazon. Affiliate links use UTM tags for attribution tracking. Transparent disclosure on every page that affiliate links exist.
- *Effort:* 3-4 days
- *Dependencies:* Affiliate accounts approved
- *Success criteria:* Clicks tracked; first commission earned within 2 weeks of launch.

**5.3 — Android Play Store via TWA**
- *Scope:* Use Bubblewrap CLI to generate the Android app shell from the existing PWA. Submit to Play Store. Pay $25 dev fee. Survive review.
- *Effort:* 3-4 days of work + 1-3 weeks of review-cycle calendar time
- *Dependencies:* PWA stable, privacy policy ironclad
- *Success criteria:* App appears in Play Store search for "paint tracker" within 4 weeks.

**5.4 — Settings, account management, polish**
- *Scope:* Data export (DSGVO right to portability — generates a JSON of all user data), full account deletion (immediate, irreversible), notification preferences, language switcher, theme (light/dark/auto), about page with credits.
- *Effort:* 1 week
- *Dependencies:* Most of the app
- *Success criteria:* Power user can manage their account without filing a support ticket.

**5.5 — Performance + accessibility pass**
- *Scope:* Lighthouse audit on every key page. Image lazy loading. Bundle size budget. Keyboard navigation. Screen reader basics. Reduced motion respect.
- *Effort:* 1 week
- *Dependencies:* Feature freeze
- *Success criteria:* All key pages score ≥90 on Lighthouse Performance and Accessibility on mid-tier Android.

### Community / growth activity

- Beta painter count target: 1,500.
- **Spiel Essen prep** (October every year — check if it falls in your window): print 500 stickers and a small banner. Whether or not you have a booth, attend, hand out stickers in the painting hall, demo the app to anyone curious. Direct face-time with high-value users is irreplaceable, especially given you're already in the DACH community.
- Recruit 3-5 "ambassador" painters: one per major language community (DE, FR, EN-DACH, EN-UK). Give them visible "founding contributor" status in exchange for sustained promotion. No premium gating to offer because there isn't one — but visibility on the project itself is the reward.
- Pre-launch press: send the actual launch announcement embargoed to Goonhammer, Tale of Painters, Spikey Bits, Brückenkopf, with a 1-week notice.

### Monetization status

- Patreon active. Initial goal: cover hosting. Realistic month-5 trajectory: 5-15 patrons, €30-150/month.
- Affiliate revenue starts showing. Realistic: €30-100/month in the first month it's live.
- No premium subscription yet. Revisit the question at month 9-10 based on whether Patreon + affiliate is covering costs + a modest take-home, or whether a freemium tier is needed to bridge the gap.

### Key decisions to make this month

- **Patreon tier structure.** Recommend simple: €3/mo (badge + name on supporters page), €10/mo (badge + name + early access to changelog + voting on what to build next), €25/mo (everything above + your sincere personal thanks). Don't over-engineer tiers — the Compendium has effectively one tier and it works.
- **App Store iOS — still no?** Confirm the decision. If a TWA on Play Store gets you EU Android coverage and PWA covers EU iOS, you're done. Revisit in month 12.

---

## Month 6 — Public launch

**Theme:** Open the doors. Maximize first-month momentum. Survive launch week.

### Features (only what's necessary for launch readiness)

**6.1 — Onboarding flow**
- *Scope:* First-time user gets a 4-step welcome: pick your primary brand, import 10 paints to start, try a conversion lookup, optionally install PWA. Skippable but pleasant.
- *Effort:* 4-5 days
- *Dependencies:* Core features stable
- *Success criteria:* 70%+ of new sign-ups complete onboarding; 40%+ install the PWA.

**6.2 — Empty states + microcopy pass**
- *Scope:* Every "you have no [X] yet" screen gets a useful prompt and a friendly tone. Error messages explain themselves. Loading states have personality.
- *Effort:* 3-4 days
- *Dependencies:* Feature freeze
- *Success criteria:* You're proud of every screen a stranger might see.

**6.3 — Launch landing page**
- *Scope:* Public homepage rebuild. Hero: "Find the right paint in any brand, in seconds." Sections: conversion engine demo (interactive), AI shelf scan demo (video), community proof (live count of contributions), pricing, FAQ. EN + DE.
- *Effort:* 1 week
- *Dependencies:* Feature set finalized
- *Success criteria:* A first-time visitor understands what the app does within 10 seconds.

**6.4 — Status page / changelog public**
- *Scope:* `/changelog` lists every notable shipment. `/status` shows current uptime (use BetterStack or similar free tier). Both publicly linked from footer. Signals trustworthiness.
- *Effort:* 1-2 days
- *Dependencies:* Hosting
- *Success criteria:* Live, accurate, visited by ~5% of new users in their first session.

### Community / growth activity (this is the bulk of month 6)

**Launch week — pre-scheduled, calendared a month ahead:**

- **Day 0 (Monday):** Soft launch to existing beta painters. Email blast: "We're public on Friday. Use code FOUNDER for 30% off lifetime if you've been here from the start."
- **Day 3 (Thursday):** Embargoed press goes live in DACH (Brückenkopf, Tabletopwelt forum post).
- **Day 4 (Friday — launch day):** r/minipainting launch post, timed for European morning (peak engagement in EU + US East Coast). Title: "After 6 months I'm launching a paint tracker that does cross-brand conversion with AI shelf scan — free to try." Link in comments per sub rules.
- **Day 4 + same day:** Hacker News Show HN post (long shot but cheap to try; tag with "EU", "indie", "no AI hype").
- **Day 5 (Saturday):** Instagram Reel + Bluesky thread with the AI shelf scan demo.
- **Day 7 (Monday after):** Goonhammer / Tale of Painters / Spikey Bits articles go live (pre-arranged).
- **Day 14:** Follow-up post in r/minipainting: "What's next, based on your feedback this week." Shows you're listening.

**Throughout the month:**

- Daily presence on r/minipainting and Tabletopwelt. Answer every paint-related question with the tool as proof, not a sales pitch.
- Reply personally to every signup in the first week (use Resend automation but keep the tone human).
- Update changelog twice this month with visible quality-of-life improvements based on feedback.

### Monetization status

- Public pricing live. Conversion-to-paid target: 3-5% in launch month.
- Affiliate revenue should show first meaningful numbers — target €100-300 in launch month from organic shopping list usage.

### Key decisions to make this month

- **Press exclusivity:** giving Goonhammer first dibs in EN and Brückenkopf first dibs in DE is more valuable than spreading across many small outlets. Don't dilute.
- **Burnout protection:** schedule a full week off in the second half of month 7. You'll need it. Tell beta painters now.

---

## What "launch day success" looks like

| Metric | Target by end of month 6 |
|--------|--------------------------|
| Registered users | 1,000 — 3,000 |
| Active users (last 7 days) | 400 — 1,000 |
| PWA installs | 200 — 800 |
| Play Store installs (TWA) | 300 — 1,000 |
| Community-submitted conversions | 200 — 500 |
| Community-submitted barcodes | 500 — 1,500 |
| Community-submitted recipes | 30 — 100 |
| Patreon supporters | 10 — 40 |
| Monthly Patreon revenue | €50 — €300 |
| Affiliate revenue (launch month) | €100 — €400 |
| German-language users | 30 — 50% of base |
| Community 1-star reviews | < 5% of total |

These ranges are deliberately wide. Hitting the bottom of every range means you have a real product with a real audience and time to improve. Hitting the top of any range means you're outperforming and should adjust month 7+ plans accordingly.

---

## Cross-cutting risks & contingencies

**Risk: Solo dev burnout.** The default failure mode for community-archive projects. The Compendium maintainer has shipped for ten years; you're aiming for similar longevity. Protect weekends starting month 1. If you find yourself coding for the third weekend in a row, scope down something — usually month 4's recipe submission flow is the right cut. The project belongs to the community, but you belong to yourself first.

**Risk: Community contributions don't materialize.** The most common cause of category abandonment. Mitigation: seed aggressively in months 1 and 2 so the database is useful even with zero community input. Make submission so easy that even a 1% participation rate compounds. Reward contributors visibly with badges, profile credit, and on-page attribution.

**Risk: DSGVO surprise.** Engage a DPO consultation in month 3 (around €200-500 for a 1-hour review). Better to fix structural problems before launch than after a complaint. Especially important if going EN+DE from day one.

**Risk: GW or Army Painter ships the killer feature.** Genuinely possible but unlikely on the timescale. If GW opens Citadel Colour to all brands tomorrow, your wedge weakens but doesn't disappear — they'll never crowdsource conversions or barcodes, and they'll never integrate retailer affiliate (cannibalizes their own sales). Reposition around community + multi-brand recipes if it happens.

**Risk: Apple App Store FOMO.** You'll be tempted in month 4 or 5. Resist. The TWA on Play Store handles 70% of EU mobile. Safari add-to-home-screen handles iOS adequately. iOS native is a year-three problem after you've validated the model.

**Risk: Patreon doesn't cover costs.** Realistic. The Compendium has ~13 patrons after 10 years; you likely won't exceed that in your first year. Mitigation: keep operating costs low (you can run the conversion engine and inventory on the free tiers of Vercel/Supabase for ~10k MAU); supplement with affiliate revenue rather than depending on patrons; revisit a modest premium tier in year two if needed.

---

## Beyond month 6 — preview of months 7-12

Sketched lightly so the month-6 launch leaves room to grow into them:

- **Month 7:** post-launch quality and infrastructure. Pay down tech debt. Build the analytics dashboards you wished you had during launch week. Take that week off.
- **Month 8:** French and Polish localization (the two next-biggest EU painter markets after DACH).
- **Month 9:** Recipe sharing as a social object — "follow" specific painters whose recipes you like, recipe-of-the-week, featured creator partnerships. Quietly evaluate whether a modest €3.99/mo premium tier makes sense given Patreon trajectory.
- **Month 10:** Retailer integrations beyond affiliate — live stock/price data from Brückenkopf, Fantasywelt, Element Games. Negotiate paid feeds.
- **Month 11:** Brand partnership pilot — Pro Acryl, Two Thin Coats, or Kimera sponsored featured-range placement, anonymized market data sale (e.g. "what's the most-owned Vallejo paint in DACH?").
- **Month 12:** First experimental AI feature, scoped narrowly. Recommended candidate: "photo of a finished mini → suggested paint recipe from community-submitted recipes that match the dominant colors." Use Claude vision or similar. Frame as a beta experiment, not a flagship feature. Re-evaluate iOS native at the same time — by now you'll know whether the iOS conversion gap is costing real engagement.

---

## Final note

The roadmap above is precise about features and fuzzy about feelings. The features are tradable; the feelings aren't. By month 6, painters should be able to say one true sentence about the app to a friend, in their own words, that sounds nothing like marketing. Whatever that sentence ends up being is the actual product. The features just get you to it.
