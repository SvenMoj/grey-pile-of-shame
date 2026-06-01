# GPoS — Grey Pile of Shame Companion · 6-Month Roadmap to Public Launch

**Owner:** Sven · **Horizon:** Month 0 → Month 6 public launch · **Audience:** EU-first, EN + DE

> **This is the reframed roadmap (v2).** The original conversion-engine-first plan is preserved at `Paint_Tracker_6_Month_Roadmap_v1_conversion-first_backup.md`. The build-task breakdown for the already-started codebase lives in `Paint_Tracker_v0.1_Feature_List.md`. The detailed product spec for the core loop lives in `Paint_Tracker_Core_Loop_Spec.md` — read that for _how_ the loop works; read this for _what ships when_.

---

## The bet, in one paragraph

Every miniature painter has a **grey pile of shame** — unbuilt, unprimed, half-painted models that pile up faster than they get finished — and no tool that makes finishing feel like winning. The category has roughly fifteen apps, and they all treat paint inventory as a spreadsheet and the pile as an afterthought. The wedge is a companion that **gamifies the hobby journey**: open it without an account, capture your pile in under two minutes, set a challenge (paint one model this weekend, finish a unit this month), mark a mini done, and watch the pile shrink. Paint substitution and cross-brand color data are a depth layer — smart and defensible — but the reason people open the app daily is the challenge streak and the pile counter. Accounts are optional; data lives locally until a painter decides they want to save and sync, at which point one magic link moves everything to the cloud. Ship it as a PWA on web (with an Android TWA wrapper for Play Store presence), EN+DE EU-first, fund hosting via Patreon, layer on retailer affiliate revenue, and reach defensibility through data curation and a growing challenge community. Six months to a public launch — but the real horizon is five-to-ten years of patient compounding.

## What changed from v1 (and why this is v3)

The v1 roadmap made the **conversion engine** the hero — account-less, SEO-friendly, great for acquisition but a weak reason to return (you look up a conversion twice a year). The v2 roadmap corrected this by centering the companion loop, but still made the **color engine** (`culori`, LAB, CIEDE2000) a month-1 gating dependency: nothing user-facing shipped until 400+ paints had verified LAB values. For a product whose real retention mechanic is the pile shrinking and challenge streaks, that ordering was still backwards.

This v3 reframe makes two changes:

1. **The pile and challenges come first.** Color math is demoted to a Phase-4 depth layer. The loop closes without it — painters track their pile, set challenges, and feel the dopamine of a shrinking counter. Substitution intelligence makes the loop smarter later; it doesn't gate the loop today.

2. **Local-first, try-before-account.** A stranger opens the app, captures their pile in under two minutes, and sets a challenge — all without creating an account. Their data lives in browser localStorage. When they decide they want to save and sync, a magic link moves everything to Supabase. This removes the friction wall that kills most hobby apps before the loop ever runs.

The conversion engine isn't thrown away — it's **the public funnel and the data backbone** for Phase 4 paint substitution. The work already done (paint catalog with LAB columns, conversion data, admin seeding tools) is exactly the foundation the substitution engine needs when it arrives.

## Operating principles

These hold across all six months. Re-read them whenever a decision feels hard.

**The loop is the product.** Model → recipe → check against owned paints → substitute → paint → log → pile shrinks. If a feature isn't on that loop or making it faster, it's a later-than-month-6 problem. Protect the loop ruthlessly.

**The data is the moat.** Features are replaceable. A trustworthy, fresh, multi-brand paint catalog with accurate color values and crowd-verified conversions — plus a growing library of structured recipes — is what a competitor can't clone in a weekend. When a trade-off appears, choose the data-curation side.

**Don't make them buy twice.** The substitution intelligence ("you already own a 96% match — use that instead of buying the Citadel one") is the single most-loved promise. It's counterintuitive that helping people _buy less_ is good business, but trust compounds and affiliate revenue still flows from the genuine gaps.

**Onboarding is priority one.** A companion that requires an afternoon of data entry before it's useful is dead on arrival. Every feature is judged partly on how fast a stranger reaches their first satisfying moment. Never make someone type what they can tap.

**Community first, revenue second.** The model is the long-lived hobby archive: respected, sustainable, revenue as a quiet byproduct. Affiliate income and any future premium tier are the cherry on top of a project that exists to serve painters.

**Build it like you'll still be here in 2036.** Decade-arc project, not a six-month sprint. Decisions that feel correct under that timeline (slow, careful, durable) will sometimes feel wrong under a six-month one. Trust the decade.

**Ship something every week.** Even in infrastructure-heavy months, push one visible improvement weekly. A silent month kills trust.

**Talk to five painters every two weeks.** DACH hobby Discords, Tabletopwelt, local clubs, Spiel Essen. Three concrete questions, then listen. Without this you'll build the wrong product confidently.

**Privacy-first by default.** EU launch means DSGVO is non-negotiable: data export, deletion flow, EU hosting, minimal third-party trackers, transparent policy from day one. A feature, not a compliance cost.

**This is a hobby platform, never a Warhammer app.** Games Workshop and other IP holders are protective of their trademarks and lore. The platform must always be generic — it tracks miniatures, paints, and hobby progress across all games and manufacturers. No first-party content may reference specific game systems, faction names, or proprietary unit names. Any such content that appears in the app (faction templates, unit lists, challenge presets referencing specific armies) must be **user-generated data**, even if we are the "users" who seed it via a launch script running under a regular user account. The distinction matters legally: we provide the platform and tools; the community creates the content. This principle applies to every layer — UI copy, seed data, onboarding templates, example recipes, and challenge presets. When in doubt, use generic terms ("army", "unit", "faction", "model") over any trademarked equivalent.

**Don't build native until you have to.** PWA + Android TWA covers ~70% of EU mobile. iOS native is a year-three problem at the earliest.

**Be wary of AI for AI's sake.** The loop holds without AI. Substitution is math (color distance), not a model. Recipes are structured data. The one AI candidate that genuinely earns its place — photo-of-shelf-to-inventory, or photo-of-mini-to-recipe — ships as a year-two experiment, never as a launch crutch.

---

## Tech stack (mostly already locked in the v0.1 codebase)

- **Frontend / app:** Next.js 16 (App Router) + TypeScript + Tailwind v4, on Vercel. PWA via `@serwist/next`.
- **Backend / data:** Supabase Frankfurt (Postgres + Auth + Storage + Realtime). Stays in the EU for DSGVO.
- **Local-first storage:** browser localStorage (versioned JSON key), migrated to Supabase on account creation.
- **Image storage:** Cloudflare R2 (cheap egress, EU-hosted) or Supabase Storage.
- **Color math:** `culori` for sRGB→LAB and CIEDE2000 ΔE — **Phase 4 only**, not installed or used until the substitution engine ships. LAB columns already exist in the DB; values will be populated when the engine arrives.
- **Email:** Resend (EU residency confirmed before launch).
- **Analytics:** Plausible (EU-hosted, cookieless).
- **Error tracking:** Sentry (EU instance).
- **Payments:** Stripe (deferred; wired but dormant until/unless a premium tier lands).
- **Android app:** Bubblewrap CLI to wrap the PWA as a TWA.
- **Repo / CI:** GitHub + Vercel auto-deploys, branch previews per PR.
- **Domain:** Pronounceable in EN and DE. Avoid "Paint" + "Track"/"Rack" (taken).

---

## Start now — the first two weeks

Because the priority is momentum, the things to do _this week_ regardless of month boundaries:

1. ✅ **Ship the pile tracker, usable without login.** Local-first storage abstraction (localStorage), pile dashboard grouped by state, quick-count onboarding ("how many unbuilt? built?"), one-tap state progression, inline item editing. Shipped — a stranger can capture their pile in under 2 minutes.
2. **Lock the domain and name.** Don't agonize past two weeks.
3. **Generalize magic-link auth** (Supabase handles most of it). The user-facing app is open to any email; `/admin` stays gated by `ADMIN_EMAIL`. On signup, migrate local pile data to Supabase in one batched insert.
4. **Build the first challenge preset** (_Weekend Warrior_ or _Pledge to Paint_) so the pile tracker immediately has a goal layer. Ugly is fine — the point is to feel the loop before polishing any node of it.

**The LAB catalog seed is no longer on the critical path for these two weeks.** It will matter in Phase 4 when the substitution engine arrives; it does not gate the pile, challenges, or onboarding.

---

## Month 1 — The pile, usable without login

**Theme:** A stranger opens the app, captures their pile in 2 minutes, and immediately sees it grouped by state. No account required. Every node can be ugly; the pile must work.

**Why this first:** The pile is the daily identity and quiet anxiety of every miniature painter. It's the reason to open the app before any substitution logic exists. Local-first removes the friction wall that kills most hobby apps — you don't ask for an email before showing value.

### Features

**1.1 — Local-first pile storage** ✅ · `PileStore` interface (list/add/addMany/advanceState/update/remove) + `localPileStore` (localStorage, versioned JSON `gpos.pile.v1`, SSR-safe, corrupt-data recovery); fully TDD with injectable Storage. `usePile()` hook with reactive state; currently always uses localPileStore — session switching ships with 1.4. _Success:_ pile data survives a page refresh without an account. ✓

**1.2 — Quick-count onboarding** ✅ · `/onboarding`: stepper per state (unbuilt / built / primed / started) → `expandQuickCount` → `usePile().addMany` → `/pile`. No naming, no login. _Success:_ a new visitor captures their whole pile in under 2 minutes. ✓

**1.3 — Pile dashboard** ✅ · `/pile`: five sections in `PILE_STATES` order with counts (the "pile shrinks" surface). Per-item one-tap **Advance** button (hidden at `painted`); inline **Edit** form (Name / Game / Faction / Points / State, backward state moves allowed); Quick-add form (single vs batch); empty pile → CTA to onboarding. Site logo and favicon live. _Success:_ advancing a mini one step takes one tap; onboarding items can be named and enriched inline. ✓

**1.4 — Generalized magic-link auth + migrate-on-signup** · _2-3 days_ · New `/login` route (no `ADMIN_EMAIL` check). Callback stops signing out non-admins: admin email → `/admin/paints`, else → `/pile`. On first authed load with non-empty local pile: push all local rows to Supabase, clear local store, set idempotency flag. _Success:_ sign-up under 30s; local pile appears in the cloud immediately; opening a second browser logged in shows the same pile.

**1.5 — Soft contextual save banner** · _1 day_ · Shown when `session == null && localPileCount > 0`. "Create a free account to save your pile & sync across devices." Dismissible per session. _Success:_ appears naturally after meaningful work, never before.

**1.6 — Account settings + DSGVO deletion stub** · _1-2 days_ · `/settings` (authed only): show email, sign out, "Delete my account" → writes `deletion_requested_at` to `profiles`, signs out, redirects with confirmation. Hard-delete is a later cron job; cascade FKs already wired. _Success:_ a user can initiate deletion without a support ticket.

### Data / curation

- No paint catalog work required this month. The `miniature_items` table and RLS are already migrated.
- Only migration needed: `profiles` (auto-created on signup, DSGVO deletion stub).

### Monetization status

- None. Personal/closed use.

### Key decisions

- **Per-model vs. per-unit.** `unit_size > 1` covers batch painting from day one. The quick-count onboarding creates skeletal items (one per state × count entered); painters name and enrich them later.
- **localStorage vs. IndexedDB.** Start with localStorage — small data, zero complexity. IndexedDB is a contained upgrade if the pile grows large.
- **Never `adminClient` in the user app.** Per-user isolation is entirely RLS-based.

---

## Month 2 — Challenges + closed beta

**Theme:** Add challenges as the goal layer on top of the pile. Invite 20-30 painters to test both together.

**Why now:** A pile tracker without a goal is a list. Challenges turn "I have 47 unbuilt minis" into "I'm going to paint 5 of them this month" — that's the retention mechanic. Beta painters validate whether the challenge presets feel right before you build more of them.

### Features

**2.1 — Challenge presets** · _1 week_ · _Weekend Warrior_ (paint 1 model before Sunday), _Month of Shame_ (reduce pile by N), _Unit Finisher_ (complete every model in a tagged unit), _Pledge to Paint_ (commit to a named model + deadline). Progress is auto-derived from pile state changes. _Success:_ a painter sets a challenge and sees it tick forward when they advance a mini to `painted`.

**2.2 — Custom challenge creation** · _2-3 days_ · User-defined title, target count, optional deadline. _Success:_ any goal a painter can describe can be tracked.

**2.3 — Completion celebration** · _1-2 days_ · Badge moment + completion timestamp on the challenge. Streaks ("painted X sessions in a row") as a secondary mechanic. _Success:_ completing a challenge feels like winning.

**2.4 — Faction/game onboarding template** · _1 week_ · "You play Death Guard — tap the units you own" from a seeded unit list. Turns pile entry into tapping. _Success:_ a painter with a known faction can add 10+ minis without typing a single name.

**2.5 — Loop polish from daily use** · _ongoing_ · You're using it daily — fix the ten things that annoy you most.

### Community / growth

- Recruit 20-30 beta painters: ~10 from r/minipainting, 5-10 from DACH Discords (Tabletopwelt, Brückenkopf), 5 specifically non-Citadel painters.
- Private beta Discord, daily presence.
- Start collecting verbatim painter quotes for the eventual landing page.
- The shareable moment this month: the pile stats after completing a challenge. Pre-record a 60-second demo the day it ships.

### Monetization status

- Still free, no payment integration. Track repeatedly-requested features — those are the premium-tier signals for later.

### Key decisions

- **Challenge visibility.** Challenges default to private. The `visibility` column is already in the schema; community/public challenges are a Phase 4 unlock.
- **Soft beta, no NDA.** Painters share screenshots regardless; the buzz helps.

---

## Month 3 — Paint inventory onboarding + public funnel

**Theme:** Make adding your paints as fast as adding your pile was. Light the public funnel so organic traffic starts building.

### Features

**3.1 — Visual brand grid** · _1 week_ · Tap pots from a swatch grid of your brand's range (recognition beats recall). _Success:_ add 30 owned paints in under 5 minutes without typing a name.

**3.2 — Add-by-set** · _2-3 days_ · Tap the boxed sets you bought (Citadel Starter, Vallejo Game Color box) → every contained paint added at once. _Success:_ one tap adds 20+ paints.

**3.3 — "Which paints did you use?" on a finished mini** · _2-3 days_ · Simple attach-a-paint-list to a painted model — no recipe structure required to start. _Success:_ a painter can log what they used in under 60 seconds.

**3.4 — Public conversion + catalog SEO pages (funnel goes live)** · _4-5 days_ · The account-less conversion lookup and per-paint catalog pages go public and indexable. Pull organic search traffic and funnel into the companion. _Success:_ Google indexes 200+ paint pages this month.

**3.5 — User-submitted conversions + voting/confidence** · _1 week_ · Logged-in users submit conversions (optional photo evidence) into a pending queue; confidence from votes + photo evidence; three-state display (verified / suggested / single submission). _Success:_ pages clearly distinguish trusted from speculative mappings.

**3.6 — German localization (full)** · _1 week_ · Complete EN→DE; JSON files structured for FR/PL later. _Success:_ a German painter never sees an English word.

### Community / growth

- Open beta: 30 → 200. Post in r/minipainting and Tabletopwelt.
- Weekly newsletter (3 paragraphs: shipped / coming / one community spotlight).
- DM 5 mid-tier YouTube creators (DE prioritized).

### Monetization status

- Wire Stripe but keep purchases off. Set up affiliate accounts (Brückenkopf-Online, Fantasywelt, Amazon DE).

### Key decisions

- **Add-by-set vs. full paint catalog seed.** The add-by-set approach gives painters value without requiring the full 400-paint LAB-verified catalog. Expand the catalog incrementally alongside community demand, not ahead of it.

---

## Month 4 — Barcodes, pile payoff, community challenges

**Theme:** Ship the unglamorous features that drive daily use and the "did I already buy this?" in-store moment. Open challenges to the community.

### Features

**4.1 — Camera + barcode scan (pots and boxes)** · _1 week_ · Scan a paint pot → add to inventory; scan a model box → add the kit to the pile. `@zxing/browser`. _Success:_ ≥80% of Citadel/Vallejo pot barcodes scan first try.

**4.2 — Pile-shrinking payoff dashboard** · _3-4 days_ · Painted-vs-unpainted ratio visualization, "painted this month" count, painted-points (Warhammer players track these for events), streak counter. The view worth screenshotting. _Success:_ painters voluntarily share their pile stats.

**4.3 — WIP photo log per model** · _3-4 days_ · Attach before/during/after photos. Doubles as shareable social proof. _Success:_ beta painters voluntarily attach photos.

**4.4 — Community/joinable challenges** · _1 week_ · Admin-created public challenges (e.g. "community Pledge to Paint — finish one mini in May"). Painters join and see a shared leaderboard. The schema is already prepared (visibility + nullable user*id). \_Success:* ≥10 painters join a shared challenge in the first week.

**4.5 — Recipe authoring v1** · _4-5 days_ · Full structured recipe (ordered steps with roles, technique notes, paint refs). Builds on the "which paints did you use?" foundation from month 3. _Success:_ a 6-step recipe authored in under 3 minutes.

### Community / growth

- The shareable moment: the **pile-shrinking payoff dashboard** and the **community challenge leaderboard**. Pre-record demos; post the day they ship.
- Beta target: 500. First media outreach: Goonhammer, Tale of Painters, Brückenkopf "tool spotlight."

### Monetization status

- Affiliate links live on paint pages and the (future) shopping list. Patreon page goes live, framed as cost-coverage (€100/mo = hosting; €300/mo = a dedicated weekend day; €1,000/mo = convention attendance).
- No premium tier yet — defer to month 9-10 at earliest.

### Key decisions

- **Patreon-first, not freemium-first.** Signals "community gift, support if you can."
- **Allow YouTube/Instagram links on recipes from day one** — meet painters where they already share.

---

## Month 5 — Patreon, Play Store, polish

**Theme:** Activate Patreon. Get on the Play Store. Fix everything painful before public launch.

### Features

**5.1 — Patreon integration** · _2-3 days_ · "Support on Patreon" on about + settings; linked supporters get a badge + supporter tag (purely social, no functional gating). _Success:_ connect in under 60s; first 5 supporters by month end.

**5.2 — Affiliate revenue UI** · _3-4 days_ · "Where to buy" routing (EU → Brückenkopf/Fantasywelt, UK → Element Games, else Amazon) with UTM attribution and transparent disclosure. _Success:_ clicks tracked; first commission within 2 weeks.

**5.3 — Android Play Store via TWA** · _3-4 days build + 1-3 weeks review_ · Bubblewrap the PWA, submit, survive review. _Success:_ appears in Play Store search for "paint tracker" within 4 weeks.

**5.4 — Settings, account management, polish** · _1 week_ · DSGVO data export (JSON of all user data), immediate full deletion, notification prefs, language switcher, theme, about/credits. _Success:_ power users self-serve without a support ticket.

**5.5 — Performance + accessibility pass** · _1 week_ · Lighthouse on every key page, lazy loading, bundle budget, keyboard nav, screen-reader basics, reduced-motion. _Success:_ ≥90 Performance and Accessibility on mid-tier Android.

### Community / growth

- Beta target: 1,500. **Spiel Essen prep** (October — check the window): 500 stickers, small banner, demo in the painting hall.
- Recruit 3-5 ambassador painters (one per language community) with visible "founding contributor" status.
- Pre-launch press embargoed to Goonhammer, Tale of Painters, Spikey Bits, Brückenkopf with one week's notice.

### Monetization status

- Patreon active (realistic month-5: 5-15 patrons, €30-150/mo). Affiliate starting (€30-100/mo). No premium yet; revisit at month 9-10.

### Key decisions

- **Patreon tiers, kept simple:** €3 (badge + name), €10 (+ early changelog + vote on what's next), €25 (+ personal thanks). Don't over-engineer.
- **iOS App Store — still no.** TWA covers EU Android; Safari add-to-home-screen covers EU iOS. Revisit month 12.

---

## Month 6 — Public launch

**Theme:** Open the doors. Maximize first-month momentum. Survive launch week.

### Features (launch-readiness only)

**6.1 — Onboarding flow polish** · _4-5 days_ · The month-2 flows, hardened: 4-step welcome (pick brand/faction, quick-capture your pile, attach a recipe, optionally install PWA). _Success:_ 70%+ complete onboarding; 40%+ install the PWA.

**6.2 — Empty states + microcopy** · _3-4 days_ · Every "nothing here yet" screen gets a useful prompt and friendly tone. _Success:_ you're proud of every screen a stranger sees.

**6.3 — Launch landing page** · _1 week_ · Hero leads with the pile-of-shame promise and "use the paints you already own." Sections: the loop demo (interactive), pile-shrink visual, "don't buy twice" substitution demo, community proof (live contribution count), pricing/Patreon, FAQ. EN + DE. _Success:_ a first-time visitor gets it within 10 seconds.

**6.4 — Public changelog + status** · _1-2 days_ · `/changelog` and `/status` (BetterStack free tier), footer-linked. Signals trustworthiness.

### Community / growth (the bulk of month 6)

**Launch week — calendared a month ahead:**

- **Day 0 (Mon):** soft launch to beta painters. "Public Friday. Code FOUNDER for 30% off lifetime if a future premium tier lands."
- **Day 3 (Thu):** embargoed DACH press live (Brückenkopf, Tabletopwelt).
- **Day 4 (Fri — launch):** r/minipainting post timed for EU morning. Lead with the pile-of-shame loop and "use paints you already own," _not_ AI.
- **Day 4:** Show HN (long shot; tag "EU", "indie", "no AI hype").
- **Day 5 (Sat):** Instagram Reel + Bluesky thread with the loop demo.
- **Day 7 (Mon):** Goonhammer / Tale of Painters / Spikey Bits articles (pre-arranged).
- **Day 14:** "What's next, based on your feedback" follow-up. Shows you're listening.

**Throughout:** daily presence on r/minipainting and Tabletopwelt (answer with the tool as proof, not a pitch); reply personally to every first-week signup; two changelog updates with visible quality-of-life wins.

### Monetization status

- Public pricing/Patreon live. Affiliate should show first meaningful numbers (target €100-300 in launch month from organic shopping-list usage).

### Key decisions

- **Press exclusivity:** Goonhammer first in EN, Brückenkopf first in DE, beats spreading thin.
- **Burnout protection:** schedule a full week off in the second half of month 7. Tell beta painters now.

---

## What "launch day success" looks like

| Metric                            | Target by end of month 6 |
| --------------------------------- | ------------------------ |
| Registered users                  | 1,000 — 3,000            |
| Active users (last 7 days)        | 400 — 1,000              |
| Models added to piles (total)     | 10,000 — 40,000          |
| Models marked painted (total)     | 1,000 — 4,000            |
| Recipes created/imported          | 300 — 1,000              |
| Substitution suggestions accepted | 2,000 — 8,000            |
| PWA installs                      | 200 — 800                |
| Play Store installs (TWA)         | 300 — 1,000              |
| Community-submitted conversions   | 200 — 500                |
| Community-submitted barcodes      | 500 — 1,500              |
| Patreon supporters                | 10 — 40                  |
| Monthly Patreon revenue           | €50 — €300               |
| Affiliate revenue (launch month)  | €100 — €400              |
| German-language users             | 30 — 50% of base         |

Ranges are deliberately wide. The bottom of every range still means a real product with a real audience. The new engagement metrics (models, painted count, substitutions accepted) matter more than the funnel metrics — they tell you whether the loop is actually being lived.

---

## Cross-cutting risks & contingencies

**Solo-dev burnout.** The default failure mode for community-archive projects. Protect weekends from month 1. If you're coding a third weekend running, cut scope — usually month 4's WIP photo log or month 3's contributor badges are the right cut. The project belongs to the community; you belong to yourself first.

**Onboarding friction kills it before the loop can.** The biggest product risk in the reframe. Mitigation: the month-2 multi-on-ramp design, tested on real strangers (not friends, who are too forgiving), with a stopwatch. If a new painter can't capture a usable pile + collection in 10 minutes, nothing downstream matters.

**Community contributions don't materialize.** Mitigation: seed aggressively (paints + your own recipes) so the app is useful with zero community input; make submission trivially easy; reward visibly.

**Bad or thin color data undermines substitution.** The substitution promise dies if a "96% match" looks wrong on the shelf. Mitigation: verify LAB values against real swatches where possible; let confidence and community votes correct the seed; never over-claim a match — round honestly and show the ΔE.

**DSGVO surprise.** Book a DPO consultation in month 3 (€200-500). Fix structural issues before launch, especially going EN+DE.

**GW or Army Painter ships the killer feature.** Unlikely on this timescale. Even if Citadel opened its app to all brands, they'll never crowdsource conversions/recipes or integrate retailer affiliate (it cannibalizes their sales). Reposition around community + the pile loop if it happens.

**iOS App Store FOMO.** Resist through year two. TWA + Safari add-to-home-screen covers EU.

**Patreon doesn't cover costs.** Realistic. Keep operating costs near-zero on free tiers; lean on affiliate; revisit a modest premium tier in year two if needed.

---

## Beyond month 6 — preview of months 7-12

- **Month 7:** post-launch quality + tech debt; analytics dashboards you wished you had during launch; **take that week off.**
- **Month 8:** the **YouTube tutorial pipeline** — paste a tutorial link → pull chapters/timestamps → parse listed paints → draft a recipe → translate to your owned paints → favorite it, with steps linked to the moment in the video. Genuinely novel and very sticky; the natural next killer feature once the loop is solid.
- **Month 9:** French and Polish localization (next-biggest EU markets after DACH). Recipes as a social object — follow painters, recipe-of-the-week. Quietly evaluate a modest €3.99/mo premium tier against Patreon trajectory.
- **Month 10:** retailer integrations beyond affiliate — live stock/price from Brückenkopf, Fantasywelt, Element Games.
- **Month 11:** brand partnership pilot (Pro Acryl, Two Thin Coats, Kimera) and anonymized market data ("most-owned Vallejo paint in DACH?").
- **Month 12:** first narrow AI experiment — photo-of-shelf → inventory, or photo-of-mini → matching community recipe. Frame as beta. Re-evaluate iOS native.

---

## Final note

The roadmap is precise about features and fuzzy about feelings. The features are tradable; the feelings aren't. By month 6, a painter should be able to say one true sentence about the app to a friend — something like "it tells me what I can paint tonight with the paints I already have, and my pile is finally shrinking." Whatever that sentence turns out to be is the actual product. The features just get you to it.
