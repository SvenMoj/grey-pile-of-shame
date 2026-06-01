# Paint Tracker — v0.2 Feature List (Gamification-First, Local-First Reframe)

> **Reframed from the original conversion-engine-first plan.** The trajectory is now: **Pile → Challenges → Paint onboarding → Social/depth**. The core app is **usable without an account** (local browser storage); account creation is the "save & sync" action, with a soft contextual prompt. Color math (`culori`, LAB, CIEDE2000) is demoted to Phase 4 — it is no longer a gating dependency for anything.

Checklist-style breakdown of every discrete piece of work. Each item is sized to roughly one focused work session.

**Priority Key:**

- **P0** — Phase 1 (Pile + local-first foundation); must ship before anything else matters.
- **P1** — Phase 2-3 (Challenges + Paint onboarding); required for a compelling product.
- **P2** — Phase 4+ (Social, color depth, polish); deferrable.

---

## 1. Project Foundation

- [x] **P0** — Set up Next.js 16 (App Router) + TypeScript project
- [x] **P0** — Add Tailwind CSS configuration
- [x] **P0** — Set up Vercel deployment from GitHub
- [ ] **P0** — Register domain and configure DNS (point to Vercel)
- [x] **P0** — Configure environment variables (`.env.local`, Vercel project envs)
- [x] **P0** — Set up Supabase Frankfurt project (free tier)
- [x] **P0** — Connect Next.js to Supabase via `@supabase/supabase-js`
- [x] **P1** — Configure GitHub Actions or Vercel build checks for type errors and lint
- [x] **P2** — Set up Prettier + ESLint with sensible defaults
- [x] **P2** — Add a `README.md` documenting local setup
- [x] **P0** — Site logo and favicon (`/grey-pile-of-shame.png` as browser icon + `SiteHeader` component on public pages)
- [ ] **P2** — Install `culori` for CIEDE2000 color distance (Phase 4 only — not a P0 dependency)

---

## 2. Database Schema

All user-domain tables are already migrated with correct state machines and owner-only RLS. Only `profiles` is still needed for Phase 1.

- [x] **P0** — `paints` table (catalog, with LAB columns)
- [x] **P0** — `conversions`, `conversion_evidence_photos`, `submissions` tables
- [x] **P0** — Database indexes + RLS policies on catalog tables
- [x] **P1** — Migration tooling setup (Supabase migrations CLI)
- [x] **P1** — Seed scripts that can rebuild the DB from CSV exports
- [ ] **P1** — Daily automated backups verified working in Supabase dashboard
- [x] **P0** — `user_paints` table + RLS (owned/wishlist/running_low states)
- [x] **P0** — `miniature_items` table + RLS (unbuilt/built/primed/in_progress/painted state machine)
- [x] **P0** — `recipes`, `recipe_steps`, `recipe_applications` tables + RLS
- [ ] **P0** — `profiles` table (`id`, `display_name`, `deletion_requested_at`, auto-created on signup via trigger) + RLS
- [ ] **P1** — `challenges` table (`id`, `user_id`, `type`, `title`, `target`, `deadline`, `visibility`, `status`) + RLS
- [ ] **P1** — `challenge_progress` table (`challenge_id`, `snapshot at each pile state change`) + RLS

---

## 3. Local-First Storage & Migrate-on-Signup (Phase 1)

The core app works without any account. Local data lives in browser localStorage; on signup it migrates to Supabase.

- [x] **P0** — `PileStore` interface (`list`, `add`, `addMany`, `advanceState`, `update`, `remove`) — the abstraction both backends implement; `update` added for inline editing
- [x] **P0** — `localPileStore` — localStorage-backed implementation, versioned JSON key (`gpos.pile.v1`), graceful fallback on corrupt data or SSR; fully TDD with injectable `Storage`
- [ ] **P0** — `supabasePileStore` — RLS browser-client-backed implementation (uses `lib/supabase/client.ts`, never `adminClient`)
- [x] **P0** — `usePile()` hook — exposes unified API to UI; currently always uses `localPileStore` (session switching ships with the auth slice)
- [ ] **P0** — `migrate-on-auth` — on first authed load, push local pile rows into Supabase under the new `user_id`, then clear local store; idempotent (migration flag persisted to localStorage)
- [ ] **P0** — Handle edge case: user signs in to an account that already has cloud data (append local items, don't clobber)

---

## 4. Authentication & Account Management (Phase 1)

Account = the "save & sync" action. The admin gate (`ADMIN_EMAIL`) must remain fully intact; the user-facing app is a separate, open flow.

- [x] **P0** — Magic-link auth infrastructure (Supabase Auth OTP, callback route) — exists but admin-gated only
- [ ] **P0** — Generalize magic-link to all users: new `/login` route (no `ADMIN_EMAIL` check), callback stops signing out non-admins, redirects admin→`/admin/paints` else→`/pile`
- [ ] **P0** — `getUserOrRedirect()` utility for pages that require auth (settings only) — no email check, parallel to existing `getAdminUserOrRedirect()`
- [ ] **P0** — Extend `proxy.ts` matcher to cover `/settings/*` (user login gate) while leaving `/pile`, `/onboarding`, `/challenges` **open** (no auth required)
- [ ] **P0** — Account settings page (`/settings`): show email, sign out, "Delete my account" stub
- [ ] **P0** — `requestAccountDeletionAction`: write `deletion_requested_at` to `profiles`, sign out, redirect with confirmation. Hard-delete is a later admin/cron job; cascade FKs already wired.

---

## 5. Pile of Shame — Core UI (Phase 1)

All UI is **client components** driven by `usePile()`. No server actions for the pile (anonymous users have no session for RLS to key off). Pages are accessible without login.

- [x] **P0** — Pile dashboard (`/pile`): five sections in `PILE_STATES` order with counts ("pile shrinks" surface)
- [x] **P0** — Per-item one-tap **Advance** button (hidden at `painted`); sets `painted_at` only on the hop into `painted`
- [x] **P0** — Quick-add form: single vs batch (`unit_size`) control, optional game/faction/point_value/state
- [x] **P0** — Per-item inline **Edit** form (Name / Game / Faction / Points / State): row expands in-place, Save persists, Cancel discards; state editable in any direction so accidental Advances can be undone
- [x] **P0** — Empty pile state → CTA to `/onboarding`
- [ ] **P0** — Soft contextual save banner: shown when `session == null && localPileCount > 0`; "Create a free account to save & sync across devices"; dismissible per session

---

## 6. Onboarding — Pile Assembly (Phase 1)

Goal: a new visitor captures their whole pile in under 2 minutes, before ever touching a sign-up form.

- [x] **P0** — Quick-count flow (`/onboarding`): one stepper per state → `expandQuickCount` → `usePile().addMany` → `/pile`. One tap per state, no naming required.
- [ ] **P1** — Faction/game template flow: "You play Death Guard — tap the units you own" from a seeded unit list (tap, don't type)
- [ ] **P1** — Step 0 context capture: "What do you mainly paint?" (game/faction picker) and "Which brands do you use?" — seeds smart defaults
- [ ] **P2** — Box-barcode scan (Phase 4 hardware): scan a box → add the kit to the pile

---

## 7. Challenges (Phase 2 — new center of gravity)

The primary retention mechanic. Progress is derived automatically from pile state changes. Schema is built community-ready but UI is personal-only at first.

- [ ] **P1** — Challenge presets: _Weekend Warrior_ (paint 1 model this weekend), _Month of Shame_ (reduce pile by N), _Unit Finisher_ (complete a full unit), _Pledge to Paint_ (commit to a specific model + deadline)
- [ ] **P1** — Custom challenge creation: user-defined title, target count, optional deadline
- [ ] **P1** — Challenge progress auto-tracking: pile state changes update active challenge progress
- [ ] **P1** — Completion celebration + badge moment
- [ ] **P1** — Streak tracking ("painted X sessions in a row")
- [ ] **P2** — Community/joinable challenges with shared leaderboard (schema already prepared)

---

## 8. Paint Inventory Onboarding (Phase 3)

No color math required. "Which paints did you use on this mini" is enough to start.

- [ ] **P1** — Visual brand grid: tap pots from a swatch grid of your brand's range (recognition beats recall)
- [ ] **P1** — Add-by-set: one tap adds every paint in a major box set (Citadel Starter, Vallejo Game Color, etc.)
- [ ] **P1** — Paint state management: owned / wishlist / running-low
- [ ] **P1** — "Which paints did you use?" — attach a simple paint list to a finished mini (no recipe authoring required to start)
- [ ] **P2** — Full recipe authoring: ordered steps with roles (basecoat/layer/highlight/etc.) and technique notes
- [ ] **P2** — Paint pot barcode scan: scan a pot → add to inventory (`@zxing/browser`)

---

## 9. Social & Depth (Phase 4)

- [ ] **P2** — Shareable progress cards (pile stats, completed challenges) — the "screenshot and share" moment
- [ ] **P2** — Paint substitution engine: given a recipe step, find close owned paints (exact-match first; `culori`/CIEDE2000 ΔE as the depth layer)
- [ ] **P2** — "What can I paint right now?" surface: scans owned inventory against recipes, answers with zero-purchase options
- [ ] **P2** — Smart consolidated shopping list: deduped across all planned projects, applies close-match substitution, affiliate routing
- [ ] **P2** — YouTube tutorial pipeline: paste a link → parse listed paints → draft a recipe (Month 8)
- [ ] **P2** — Photo shelf-scan AI experiment (Year 2)

---

## 10. Public Discovery Funnel & SEO

- [ ] **P1** — Refactor homepage (`/`) as an account-less public paint/conversion lookup (feeds people into the app)
- [ ] **P1** — Static-generated public paint detail pages (`/paints/[brand]/[paint]`) for SEO
- [ ] **P2** — Permalink-friendly conversion routes (`/paints/citadel/mephiston-red/to/vallejo-game-color`)
- [ ] **P2** — Public community recipe browsing directory

---

## 11. Community Contributions

- [ ] **P1** — User-submitted conversions + vote-driven confidence scoring
- [ ] **P1** — Admin queue upgrade: review, approve, reject, or merge submissions
- [ ] **P2** — Contributor profile URLs with reputation milestones

---

## 12. Infrastructure: Email, Analytics, Payments

- [ ] **P1** — Resend transactional mail (magic link, submission receipts) — domain SPF/DKIM
- [ ] **P1** — Plausible analytics (EU-hosted, cookieless) — key goal events: pile added, challenge completed, account created
- [ ] **P1** — Affiliate routing (Fantasywelt, Element Games, Amazon DE) in shopping list
- [ ] **P2** — Patreon integration (badge, changelog access)
- [ ] **P2** — Stripe (wired but dormant until/unless a premium tier lands)

---

## 13. Internationalization & SEO

- [ ] **P1** — `next-intl` setup + full EN→DE localization
- [ ] **P1** — `hreflang` + structured JSON-LD metadata on public catalog pages
- [ ] **P2** — FR and PL localization (next-biggest EU markets)

---

## 14. UI/UX Polish, Accessibility & Compliance

- [ ] **P0** — Legally compliant Imprint/Impressum and Privacy Policy (DACH / DSGVO)
- [ ] **P0** — Mobile-responsive layout (primary surface is phone-at-the-desk)
- [ ] **P1** — Loading states (skeletons, minimal spinners)
- [ ] **P1** — Dark/light mode synced to device preference
- [ ] **P1** — WCAG AA contrast pass across all assets
- [ ] **P1** — Lighthouse ≥90 Performance and Accessibility on mid-tier Android

---

## 15. Pre-Launch Quality Assurance

- [ ] **P1** — Manual end-to-end on iOS Safari + Android Chrome: anonymous → sign-up → data migrated → cross-device sync
- [ ] **P1** — Closed beta: 20-30 trusted hobby painters

---

## Explicitly OUT of Scope for v0.2 Launch

- **`culori` / LAB / CIEDE2000 substitution engine as a P0** — Phase 4 only; paint suggestions start with exact match.
- **YouTube Tutorial Auto-Pipeline** — Month 8.
- **AI Shelf-Scanning / Photo-of-Mini → Recipe AI** — Year 2.
- **Native Social Graph** (followers, likes, comments) — post-launch.
- **Native iOS** — PWA + Android TWA covers launch; iOS native is Year 3.
- **Live Retail Stock API Feeds** — Month 10.
- **In-app Chat** — completely out of scope.

---

## Quick Dashboard

- **Phase 1 (P0):** ~25 work sessions → anonymous pile tracker with local storage, magic-link signup, migrate-on-auth, soft save CTA.
  - ✅ Done: `PileStore` + `localPileStore` (TDD), `usePile()` hook, `/pile` dashboard (Advance, Quick-add, Edit inline, empty state), `/onboarding` quick-count flow, site logo/favicon.
  - 🔲 Remaining: `profiles` migration, generalized magic-link auth + `/login`, `supabasePileStore`, migrate-on-auth, `/settings`, soft save banner, Imprint/Privacy Policy.
- **Phase 2 (P1 first wave):** ~20 sessions → challenges, paint inventory onboarding.
- **Phase 3+ (P1/P2):** public funnel, community, color depth, social.
