# GPoS — Grey Pile of Shame Companion · 6-Month Roadmap to Public Launch

**Owner:** Sven · **Horizon:** Month 0 → Month 6 public launch · **Audience:** EU-first, EN + DE

> **This is the reframed roadmap (v2).** The original conversion-engine-first plan is preserved at `Paint_Tracker_6_Month_Roadmap_v1_conversion-first_backup.md`. The build-task breakdown for the already-started codebase lives in `Paint_Tracker_v0.1_Feature_List.md`. The detailed product spec for the core loop lives in `Paint_Tracker_Core_Loop_Spec.md` — read that for _how_ the loop works; read this for _what ships when_.

---

## The bet, in one paragraph

Every miniature painter has a **grey pile of shame** — unbuilt, unprimed, half-painted models that pile up faster than they get finished — and a drawer of paints they can never quite map to a tutorial. The category has roughly fifteen apps, and they all treat paint inventory as a spreadsheet and the pile as an afterthought. The wedge is a companion that closes one tight loop: **pick a model from your pile → attach a recipe (yours, imported, or from a tutorial) → the app checks it against the paints you already own → fills the gaps with close matches you have rather than telling you to buy more → you paint it → log it → the pile shrinks.** The trustworthy cross-brand color data that powers the substitution is the moat; the loop is the product; the shrinking pile is the feeling people come back for. Ship it as a PWA on web (with an Android TWA wrapper for Play Store presence), EN+DE EU-first, fund hosting via Patreon, layer on retailer affiliate revenue, and reach defensibility through data curation rather than features. Six months to a public launch — but the real horizon is five-to-ten years of patient compounding.

## What changed from v1 (and why)

The v1 roadmap made the **conversion engine** the hero because it's account-less and SEO-friendly — a great way to _acquire_ but a weak reason to _return_ (you look up a conversion twice a year). The grey pile of shame is the opposite: it's the hobbyist's daily identity and quiet anxiety, which means accounts, retention, and word-of-mouth come for free.

So the conversion engine isn't thrown away — it's **demoted to the funnel and the data backbone.** The work already done on the v0.1 codebase (paint catalog with hex/LAB values, conversion data, admin seeding tools) is exactly the color foundation the substitution engine needs. The companion loop the old plan deferred to "v0.5" is now the center of gravity, and conversion lookups become a public, indexable, account-less surface that feeds people into it.

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

**Don't build native until you have to.** PWA + Android TWA covers ~70% of EU mobile. iOS native is a year-three problem at the earliest.

**Be wary of AI for AI's sake.** The loop holds without AI. Substitution is math (color distance), not a model. Recipes are structured data. The one AI candidate that genuinely earns its place — photo-of-shelf-to-inventory, or photo-of-mini-to-recipe — ships as a year-two experiment, never as a launch crutch.

---

## Tech stack (mostly already locked in the v0.1 codebase)

- **Frontend / app:** Next.js 15 (App Router) + TypeScript + Tailwind, on Vercel. PWA via `@serwist/next`.
- **Backend / data:** Supabase Frankfurt (Postgres + Auth + Storage + Realtime). Stays in the EU for DSGVO.
- **Image storage:** Cloudflare R2 (cheap egress, EU-hosted) or Supabase Storage.
- **Color math:** `culori` (or equivalent) for sRGB→LAB and CIEDE2000 ΔE, computed at seed time and cached on each paint row. The substitution engine is a database query, not a service.
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

1. **Finish the paint catalog seed with accurate LAB values for the four big brands** (Citadel, Vallejo, Army Painter Fanatic, Scale75). This is the critical path — the substitution engine, recipes, and conversion all depend on it. Compute LAB from hex at seed time and store it. Aim for 400+ paints with verified color values.
2. **Lock the domain and name.** Don't agonize past two weeks.
3. **Stand up magic-link auth** (Supabase handles most of it). The companion is personal, so accounts come in early — unlike v1.
4. **Build the thinnest end-to-end slice of the loop** for yourself only: add one model, attach a three-step recipe, see which steps you can cover from a hardcoded inventory, see one substitution suggestion. Ugly is fine. The point is to feel the loop before polishing any node of it.

---

## Month 1 — The core loop, rough but real

**Theme:** Get the whole loop working end-to-end for yourself and a tiny circle of trusted painters. Every node can be ugly; the loop must be complete.

**Why this first:** A complete-but-rough loop teaches you more than any one polished feature. It also de-risks the hardest integration — substitution against a real inventory against a real recipe — before you've built UX around assumptions.

### Features

**1.1 — Magic-link auth + account shell** · _2-3 days_ · Supabase Auth, no passwords, account deletion stub in settings. _Success:_ sign-in under 30s.

**1.2 — Paint inventory** · _1 week_ · Add a paint from the catalog with one tap; states: owned / wishlist / running-low; custom paint add (never paywalled, free text + color picker). _Success:_ build a 50-paint inventory in under 15 min.

**1.3 — Pile of shame: model tracking** · _1 week_ · Add models with progress states (unbuilt → built → primed → in progress → painted), a count or per-model entry, optional faction/game tag. _Success:_ a painter can capture their whole pile in under 10 minutes (see onboarding design below).

**1.4 — Structured recipe model** · _4-5 days_ · A recipe is an ordered list of steps; each step has a role (basecoat / shade / layer / highlight / edge / drybrush / contrast / wash / glaze / technical), a referenced paint, a technique note. Brand-agnostic by design. _Success:_ you can author a 6-step recipe in under 3 minutes.

**1.5 — Substitution engine v1** · _1 week_ · Given a recipe step's target paint, find the closest paints **in the user's inventory** by CIEDE2000 ΔE, with role-aware tolerance (a basecoat tolerates more deviation than a final highlight). Display "you own X — a 96% match." _Success:_ for a typical recipe, the app correctly tells you which steps you can already cover.

**1.6 — Close the loop** · _3-4 days_ · Attach a recipe to a model; the model view shows, per step, "you have it / close match you own / you'd need to buy." Mark the model painted; the pile count updates. _Success:_ you complete one real model start-to-log using only the app.

### Data / curation

- Finish the 400+ paint seed with LAB. **This is non-negotiable and the gating dependency for everything.**
- Seed 20-30 of your own real recipes so the recipe surfaces aren't empty when beta painters arrive.

### Monetization status

- None. Personal/closed use.

### Key decisions

- **Per-model vs. per-unit granularity.** Recommend supporting both: a "model" can be a single mini or a unit of N identical minis (batch painting is the norm). The recipe attaches to the unit.
- **How much recipe structure to enforce.** Recommend roles are optional but encouraged — a freeform "I used these paints" recipe must still work, or people won't enter anything.

---

## Month 2 — Onboarding that doesn't suck + closed beta

**Theme:** Make capturing your pile and your paints fast enough that a stranger will actually do it. Invite 20-30 painters.

**Why now:** The loop exists but is worthless if nobody can populate it. Onboarding is the make-or-break, so it gets a dedicated month rather than a launch-week scramble.

### The onboarding design (the "think of something" answer)

A single rigid flow fails because painters arrive in different states. The design is **progressive and multi-on-ramp**, built on one rule: _value before completeness._ They should reach a satisfying moment in under 60 seconds and keep enriching their collection over weeks, never hitting a wall of data entry.

**Step 0 — Two taps of context (15 seconds).** "What do you mainly paint?" (game/faction picker) and "Which brands do you use?" (multi-select). This seeds smart defaults for everything that follows.

**The pile of shame — three on-ramps, pick what fits:**

- **Quick-count (the emotional hook, ~20 seconds):** steppers per state — "roughly how many unbuilt / built / primed / started?" Instantly visualize the pile. No naming required; refine into individual models later. Most people start here.
- **Faction templates:** "You play Death Guard — tap the units you own" from a seeded unit list. Turns naming into tapping.
- **Box-barcode scan (lands month 4):** scan the box, it resolves to the kit. Designed for now, shipped later.

**The paint range — also multi-on-ramp:**

- **Add-by-set (fastest):** tap the boxed sets you bought (a Citadel mega set, a Vallejo Game Color box) → every contained paint is added at once.
- **Visual brand grid:** tap pots from a swatch grid of your brand's range. Recognition beats recall.
- **Bulk type-ahead:** search-and-multi-select for the long tail.
- **Pot-barcode scan (lands month 4):** at the desk or in the store.
- **Photo shelf-scan (year-two AI experiment):** the dream; explicitly deferred. Bulk add gets ~90% of the value today.

The data model is designed now so barcode and photo on-ramps slot in later without rework.

### Features

**2.1 — Onboarding flows** · _1 week_ · Step 0 + quick-count + faction templates + add-by-set + visual grid + bulk type-ahead. _Success:_ a new painter captures a representative pile and paint collection in under 10 minutes total.

**2.2 — Cloud sync + offline** · _1 week_ · All data in Supabase, IndexedDB cache for instant load and desk-side offline resilience (phone propped up, weak wifi). Server-wins conflict resolution. _Success:_ add on phone, see on laptop in seconds; works with wifi off.

**2.3 — "What can I paint right now?" v1** · _4-5 days_ · Given owned paints + the pile, surface a model + recipe completable today with zero purchases. _Success:_ the home screen can always answer "what now?" with at least one real suggestion.

**2.4 — Loop polish from daily use** · _ongoing_ · You're now using it daily — fix the ten things that annoy you most.

### Community / growth

- Recruit 20-30 beta painters: ~10 from r/minipainting (DM collection-photo posters), 5-10 from DACH Discords (Tabletopwelt, Brückenkopf, Spielmaterial), 5 non-Citadel painters specifically (Vallejo/AP heavies care most about substitution).
- Private beta Discord, daily presence.
- Start collecting verbatim painter quotes for the eventual landing page.

### Monetization status

- Still free, no payment integration. Track repeatedly-requested features — those are the premium-tier signals for later.

### Key decisions

- **Free forever vs. eventual premium.** Recommended split (decide now so UX assumes it): free = full loop, pile tracking, inventory to a generous cap, all conversions, basic recipes; eventual premium (year two, if at all) = unlimited everything, photo shelf-scan, advanced batch tools, price alerts.
- **Soft beta, no NDA.** Painters share screenshots regardless; the buzz helps.

---

## Month 3 — Recipes as a shareable object + community keeps the data alive

**Theme:** Make recipes something people want to use _and_ share, and turn the conversion/recipe data from "Sven's manual curation" into "the community grows it." Light the public funnel.

### Features

**3.1 — Recipe library + "I can paint this" filter** · _1 week_ · Browse community recipes; filter to "recipes I can fully paint with what I own" (with close-match substitution inline). _Success:_ find a usable, ownable recipe for a given scheme in under 90 seconds.

**3.2 — Recipe submission + the GW-recipe→your-paints verb** · _1 week_ · Submit a recipe; paste/enter a recipe in one brand and get it translated to the brands you own, substitutions and confidence flagged. Same submit/vote/confidence pattern as conversions. _Success:_ 5 beta painters submit a recipe in week one; the translate feature feels like magic.

**3.3 — User-submitted conversions + voting/confidence** · _1 week_ · Logged-in users submit conversions (optional photo-pair evidence) into a pending queue; confidence score from confirming votes, contributor reputation, photo evidence, age; three-state display (verified / suggested / single submission). _Success:_ pages clearly distinguish trusted from speculative mappings.

**3.4 — Contributor reputation & badges** · _3-4 days_ · Profile shows submission count, verified-rate, badges; public profile URL. _Success:_ ≥3 beta painters voluntarily share their profile to a community.

**3.5 — Public conversion + catalog SEO pages (the funnel goes live)** · _4-5 days_ · The already-built account-less conversion lookup and per-paint catalog pages go public and indexable. These pull organic search traffic and funnel into the companion. _Success:_ Google indexes 200+ paint pages this month.

**3.6 — German localization (full)** · _1 week_ · Complete EN→DE for UI, errors, marketing; JSON files structured for FR/PL later; locale-aware formatting. _Success:_ a German painter never sees an English word.

### Community / growth

- Open beta: 30 → 200. Post in r/minipainting and Tabletopwelt ("I built a pile-of-shame + paint companion, looking for testers").
- Weekly newsletter (3 paragraphs: shipped / coming / one community spotlight).
- DM 5 mid-tier YouTube creators (DE prioritized: Modellbahn-Berni, Brückenkopf; EN: Tabletop Minions, Ninjon). Offer lifetime premium for an honest review. No expectations.

### Monetization status

- Wire Stripe but keep purchases off. Set up Brückenkopf-Online, Fantasywelt, Amazon DE affiliate accounts.

### Key decisions

- **Submission quality bar.** Recommend photo-pair required for "verified," plain text allowed for "suggested." Lowers barrier without lowering trust.
- **Profiles public-by-default** with an easy toggle. Hobbyists like being seen.

---

## Month 4 — Barcodes, the in-store moment, batch & shopping

**Theme:** Ship the unglamorous features that drive daily use and the "did I already buy this?" in-store moment.

### Features

**4.1 — Camera + barcode scan (pots and boxes)** · _1 week_ · Scan a paint pot → add to inventory (or capture an unknown barcode for credit); scan a model box → add the kit to your pile. `@zxing/browser`. _Success:_ ≥80% of Citadel/Vallejo pot barcodes scan first try; unknown barcodes captured at ≥30%.

**4.2 — Smart consolidated shopping list** · _4-5 days_ · Across _all_ planned projects, dedup needs and apply close-match substitution so it shows the genuine minimum to buy — and routes purchases to affiliate retailers. The honest version of monetization: it actively helps you buy less. _Success:_ for a multi-project user, the list is shorter than the naive sum and the substitutions are trusted.

**4.3 — Batch / unit recipe consistency** · _4-5 days_ · Save a recipe to a unit and re-apply it months later ("what did I use on the first 10 Plague Marines?"). _Success:_ a painter can repaint a squad identically without guesswork.

**4.4 — WIP photo log per model** · _3-4 days_ · Attach before/during/after photos to a model. Doubles as shareable social proof. _Success:_ beta painters voluntarily attach photos.

**4.5 — Pile-shrinking payoff** · _3-4 days_ · Painted-vs-unpainted ratio, "painted this month," painted-points (Warhammer players track these), a satisfying shrink visualization. The emotional dopamine that drives daily return. _Success:_ the progress view is something painters screenshot and share.

### Community / growth

- The shareable moment this month is the **shopping-list-that-tells-you-not-to-buy** and the **painted-points tracker**. Pre-record 60-second demos; post the day they ship.
- Beta target: 500. First media outreach: Goonhammer, Tale of Painters, Brückenkopf "tool spotlight."

### Monetization status

- Affiliate links go live in the shopping list and on paint pages (transparent disclosure). Patreon page goes live, framed as cost-coverage (€100/mo = hosting; €300/mo = a dedicated weekend day; €1,000/mo = convention attendance).
- No premium tier yet — defer to month 9-10 at earliest.

### Key decisions

- **Patreon-first, not freemium-first.** Signals "community gift, support if you can," which fits the long-game sensibility.
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
