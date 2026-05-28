# Paint Tracker — v0.1 Codebase Feature List

Checklist-style breakdown of every discrete piece of work for the v0.1 codebase. Each item is sized to roughly one focused work session (a few hours to a day). Copy into Linear, GitHub Issues, Notion, or a plain checkbox-list — whatever your tracker is.

**Priority key:**

- **P0** — blocks launch; site cannot go public without it
- **P1** — strongly recommended for launch; cut only if time-critical
- **P2** — nice to have; reasonable to defer to v0.1.1

---

## 1. Project foundation

- [ ] **P0** — Set up Next.js 15 (App Router) + TypeScript project
- [ ] **P0** — Add Tailwind CSS configuration
- [ ] **P0** — Set up Vercel deployment from GitHub
- [ ] **P0** — Register domain and configure DNS (point to Vercel)
- [ ] **P0** — Configure environment variables (`.env.local`, Vercel project envs)
- [ ] **P0** — Set up Supabase Frankfurt project (free tier)
- [ ] **P0** — Connect Next.js to Supabase via `@supabase/supabase-js`
- [ ] **P1** — Configure GitHub Actions or Vercel build checks for type errors and lint
- [ ] **P2** — Set up Prettier + ESLint with sensible defaults
- [ ] **P2** — Add a `README.md` documenting local setup (you, in three months, will thank you)

---

## 2. Database schema

- [ ] **P0** — `paints` table with columns: `id` (slug), `brand`, `range`, `name`, `sku_code`, `hex`, `lab_l`, `lab_a`, `lab_b`, `size_ml`, `type`, `status`, `version`, `discontinued_date`, `created_at`, `updated_at`
- [ ] **P0** — `conversions` table: `id`, `paint_a_id`, `paint_b_id`, `confidence`, `source_type`, `source_url`, `notes`, `verified_count`, `disputed_count`, `created_at`, `updated_at`
- [ ] **P0** — `conversion_evidence_photos` table: `id`, `conversion_id`, `photo_url`, `caption`, `created_at`
- [ ] **P0** — `submissions` table: `id`, `paint_a_id`, `paint_b_id`, `submitter_email`, `email_verified_at`, `photo_url`, `notes`, `status` (pending/accepted/rejected), `created_at`, `reviewed_at`
- [ ] **P0** — Database indexes on `paints.name`, `paints.brand`, `conversions.paint_a_id`, `conversions.paint_b_id`
- [ ] **P0** — Supabase Row Level Security policies (public read for paints/conversions; admin-only write)
- [ ] **P1** — Migration tooling decision (Supabase migrations CLI, or `drizzle-kit`, or hand-managed SQL — pick one and document it)
- [ ] **P1** — Seed scripts that can rebuild the DB from CSV exports (for disaster recovery)
- [ ] **P1** — Daily automated backups verified working in Supabase dashboard

---

## 3. Admin tooling (private)

This is the seeding interface — ugly is fine. You're the only user.

- [ ] **P0** — Password-protected admin route (`/admin`) with a single static password from env var
- [ ] **P0** — Admin: list all paints with filter by brand
- [ ] **P0** — Admin: create new paint form
- [ ] **P0** — Admin: edit paint form
- [ ] **P0** — Admin: delete paint (soft delete preferred)
- [ ] **P0** — Admin: list all conversions with filter by paint
- [ ] **P0** — Admin: create new conversion form (pick paint A, pick paint B, set confidence, add source)
- [ ] **P0** — Admin: edit conversion form
- [ ] **P0** — Admin: bulk-import paints from CSV (paste or upload)
- [ ] **P0** — Admin: bulk-import conversions from CSV
- [ ] **P1** — Admin: submission review queue (approve / reject with reason)
- [ ] **P1** — Admin: dashboard with counts (total paints, total conversions, pending submissions, recent activity)
- [ ] **P2** — Admin: "merge two paints" tool for cleaning up duplicates from seeding
- [ ] **P2** — Admin: changelog editor (write entries that show on `/changelog`)

---

## 4. Public site — core pages

- [ ] **P0** — Homepage (`/`) with prominent conversion search bar, brief explainer, recently-added conversions
- [ ] **P0** — Paint detail page (`/paints/[brand-slug]/[paint-slug]`) — static-generated, shows name, hex swatch, all conversions
- [ ] **P0** — Brand index page (`/brands/[brand-slug]`) — lists all paints in that brand, grouped by range
- [ ] **P0** — All-brands page (`/brands`) — lists every brand with counts
- [ ] **P0** — 404 page with helpful suggestions
- [ ] **P0** — Generic error boundary page
- [ ] **P1** — Range index page (`/brands/[brand-slug]/[range-slug]`)
- [ ] **P1** — `/changelog` page reading from the DB
- [ ] **P2** — Recently-updated paints feed (`/recent`)
- [ ] **P2** — "Random paint" route (`/random`) — fun discovery feature

---

## 5. Search & conversion lookup

- [ ] **P0** — Search input component (header on every page) with type-ahead suggestions
- [ ] **P0** — Search backend: Postgres full-text search across paint name, brand, SKU
- [ ] **P0** — Search results page (`/search?q=...`) with paint cards
- [ ] **P0** — Conversion display component: shows paint A → paint B with confidence visualization
- [ ] **P0** — Confidence visualization: progress bar with percentage and color coding (green/yellow/red)
- [ ] **P0** — Source attribution on each conversion (official chart / community / hex-derived) with link
- [ ] **P0** — Photo evidence thumbnails on conversion (click to enlarge)
- [ ] **P1** — "Closest match by hex" fallback when no curated conversion exists for a brand pair
- [ ] **P1** — Filter conversions by target brand on paint pages
- [ ] **P1** — Permalink-friendly conversion URLs (`/paints/citadel/mephiston-red/to/vallejo-game-color`)
- [ ] **P2** — Comparison view: side-by-side two paints with hex difference, LAB ΔE shown

---

## 6. Submission flow

- [ ] **P0** — "Submit a missing conversion" button on every paint page
- [ ] **P0** — Submission form: pick paint A (pre-filled from context), pick paint B from catalog, optional notes
- [ ] **P0** — Email verification: enter email, receive magic link, click to confirm submission
- [ ] **P0** — Backend: submission record stored with `email_verified_at` once verified
- [ ] **P1** — Optional photo upload during submission (Cloudflare R2 signed URL flow)
- [ ] **P1** — "Suggest a missing paint" alternative form (when the user can't find their paint in the catalog)
- [ ] **P1** — Email notification to submitter when their submission is accepted
- [ ] **P1** — Email notification to admin (you) when a new submission arrives
- [ ] **P2** — Public credit on the conversion page: "Contributed by [first-name] from [email-domain]"
- [ ] **P2** — Contributor opt-in: show full name and link to their profile (where applicable)

---

## 7. Photo / image handling

- [ ] **P0** — Cloudflare R2 bucket configured (or Supabase Storage as alternative)
- [ ] **P0** — Image upload endpoint with file size limit (5 MB) and type validation (JPEG/PNG/WebP)
- [ ] **P0** — Image display optimization: lazy load, modern format serving
- [ ] **P1** — Image thumbnail generation (or use Vercel Image Optimization)
- [ ] **P1** — Photo lightbox / modal for full-size viewing
- [ ] **P2** — Photo metadata extraction (EXIF stripping for privacy)

---

## 8. SEO & discovery

- [ ] **P0** — `<title>` and `<meta description>` per page
- [ ] **P0** — OpenGraph and Twitter card meta tags
- [ ] **P0** — JSON-LD `Product` schema on paint pages
- [ ] **P0** — JSON-LD `BreadcrumbList` schema
- [ ] **P0** — `sitemap.xml` generated at build time
- [ ] **P0** — `robots.txt` allowing all crawlers, pointing at sitemap
- [ ] **P0** — Semantic HTML structure (proper `<h1>`, `<h2>`, etc.)
- [ ] **P1** — Canonical URLs to avoid duplicate content (especially for `/search` results)
- [ ] **P1** — Per-paint structured `OG image` (auto-generated with paint name + hex swatch)
- [ ] **P2** — Submit sitemap to Google Search Console
- [ ] **P2** — Submit sitemap to Bing Webmaster Tools

---

## 9. Internationalization (EN + DE)

- [ ] **P0** — Install and configure `next-intl` or `next-i18next`
- [ ] **P0** — Externalize all UI strings to translation files
- [ ] **P0** — English translation file complete
- [ ] **P0** — German translation file complete
- [ ] **P0** — Locale routing (`/de/...` and `/en/...` or default + `/de/`)
- [ ] **P0** — Locale switcher in header
- [ ] **P0** — Automatic locale detection from Accept-Language header (with override)
- [ ] **P1** — Locale-aware date and number formatting
- [ ] **P1** — Hreflang tags in HTML head for SEO
- [ ] **P1** — German translation reviewed by a native-speaker painter (paid review: €100-200)
- [ ] **P2** — Translation of paint range names (e.g. "Layer" / "Schicht") where it makes sense

---

## 10. Compliance & DSGVO

- [ ] **P0** — Privacy policy page (`/privacy`) in EN and DE
- [ ] **P0** — Imprint / Impressum page (`/impressum`) — legally required in Germany
- [ ] **P0** — Cookie banner ONLY if non-essential cookies are set; aim for zero non-essential cookies and skip the banner
- [ ] **P0** — DSGVO data deletion: user can request deletion of their email + submissions via form
- [ ] **P0** — DSGVO data export: user can request a JSON export of all data tied to their email
- [ ] **P1** — Light terms of service page (`/terms`)
- [ ] **P1** — Cookie-less analytics confirmed (Plausible default)
- [ ] **P1** — All third-party services audited and listed in privacy policy
- [ ] **P2** — One-hour DPO consultation booked (€200-500) to review the stack before launch

---

## 11. Analytics & monitoring

- [ ] **P0** — Plausible analytics integrated (€9/mo plan)
- [ ] **P0** — Custom goal: "Conversion lookup completed"
- [ ] **P0** — Custom goal: "Submission started"
- [ ] **P0** — Custom goal: "Submission completed"
- [ ] **P1** — Sentry or simple structured error logging
- [ ] **P1** — Server-side request logging for the admin endpoints
- [ ] **P2** — Uptime monitoring (UptimeRobot free tier or BetterStack)

---

## 12. Email & transactional

- [ ] **P0** — Resend account set up with verified domain (SPF, DKIM)
- [ ] **P0** — Submission verification email template (EN and DE)
- [ ] **P0** — Submission accepted email template (EN and DE)
- [ ] **P1** — Submission rejected email template with reason field (EN and DE)
- [ ] **P2** — Newsletter signup endpoint (don't build the newsletter yet, just collect emails for v0.5)

---

## 13. Static / informational content

- [ ] **P0** — About page explaining what the project is, who built it, why
- [ ] **P0** — FAQ page with at least 8-12 questions answered
- [ ] **P0** — Contact page with an email address and a contact form
- [ ] **P1** — "How conversions work" explainer page (linked from confidence scores)
- [ ] **P1** — "How to contribute" page explaining the submission flow
- [ ] **P2** — Press kit page (`/press`) with logo, screenshots, one-liner — useful when journalists email

---

## 14. UI / UX polish

- [ ] **P0** — Mobile-responsive layout for every page (test on real device, not just devtools)
- [ ] **P0** — Touch-friendly tap targets (minimum 44px)
- [ ] **P0** — Empty states with helpful copy on every list view
- [ ] **P0** — Loading states (skeletons or spinners) where data fetches happen
- [ ] **P0** — Error states with retry buttons
- [ ] **P0** — Header with logo, search, locale switcher, nav
- [ ] **P0** — Footer with links to about, FAQ, privacy, impressum, contact
- [ ] **P1** — Light/dark theme toggle (auto-detect default)
- [ ] **P1** — Keyboard navigation pass (focus rings, tab order, escape closes modals)
- [ ] **P1** — Reduced-motion media query respect
- [ ] **P1** — Color contrast meeting WCAG AA on all text
- [ ] **P2** — Subtle micro-animations (page transitions, hover states)
- [ ] **P2** — Custom 404 illustration

---

## 15. Performance

- [ ] **P0** — Lighthouse Performance ≥90 on `/` (mobile)
- [ ] **P0** — Lighthouse Performance ≥90 on a paint page (mobile)
- [ ] **P0** — Lighthouse Accessibility ≥90 across all key pages
- [ ] **P0** — Lighthouse SEO ≥90 across all key pages
- [ ] **P0** — Image lazy loading throughout
- [ ] **P0** — Next.js `Image` component used everywhere
- [ ] **P1** — Static generation (`generateStaticParams`) for all paint pages
- [ ] **P1** — Incremental Static Regeneration for paint pages (re-build when data changes)
- [ ] **P1** — Font preload + `font-display: swap`
- [ ] **P2** — Bundle size budget enforced in CI

---

## 16. Branding & design

- [ ] **P0** — Project name finalized
- [ ] **P0** — Logo (even a text-based mark is fine for v0.1)
- [ ] **P0** — Favicon and Apple touch icon
- [ ] **P0** — Color palette defined and used consistently (Tailwind theme extension)
- [ ] **P0** — Typography pairing chosen (one serif or display + one sans)
- [ ] **P1** — Open Graph default image (used when paint-specific OG image isn't available)
- [ ] **P1** — Brand voice / tone document — even a one-pager
- [ ] **P2** — Stickers designed and printed (for Spiel Essen later)

---

## 17. Pre-launch QA

- [ ] **P0** — Manual smoke test of every page on a real Android phone
- [ ] **P0** — Manual smoke test of every page on iOS Safari
- [ ] **P0** — Smoke test on Firefox desktop
- [ ] **P0** — Smoke test on Edge desktop
- [ ] **P0** — All links validated (no 404s in-site)
- [ ] **P0** — All images have alt text
- [ ] **P0** — All forms submit successfully end-to-end
- [ ] **P0** — Submission verification email arrives within 60 seconds
- [ ] **P0** — Search returns relevant results for 20 manual test queries
- [ ] **P0** — German pages reviewed by native speaker
- [ ] **P1** — Closed beta with 5-10 friendly painters
- [ ] **P1** — Top 10 beta-reported issues fixed

---

## Explicitly OUT of scope for v0.1

These are tempting and stay deferred. Resist scope creep.

- **User accounts** — no signup, no login, no profiles. (v0.5)
- **Inventory tracking** — no "paints I own." (v0.5)
- **Project tracker** — no army/model project linking. (v0.5)
- **Wishlist / shopping list** — deferred. (v0.5)
- **Barcode scanning** — deferred. (v0.5)
- **Camera / photo-to-paint AI** — deferred. (year 2 experiment)
- **AI shelf scan** — explicitly cut. (year 2 experiment, maybe)
- **Recipe library** — deferred. (v0.5)
- **PWA install prompt** — deferred. (v0.5)
- **Android Play Store / TWA** — deferred. (v1.0)
- **iOS native app** — not on roadmap.
- **Cloud sync infrastructure** — no accounts means nothing to sync. (v0.5)
- **Patreon integration** — deferred until you have an audience. (v1.0)
- **Affiliate links** — deferred until you have traffic worth monetizing. (v1.0)
- **Premium subscription** — deferred to year 2 at earliest. (v2.0)
- **Social features (follow, like, comment)** — deferred. (v1.0 at earliest)
- **Push notifications** — deferred. (v0.5)
- **Multi-device sync** — no accounts means no sync. (v0.5)
- **Tests** — manual QA only at v0.1. Add Vitest + Playwright at v0.5. (P2 nice-to-have)

---

## Quick stats

- **Total P0 items:** 70 — these are the launch-critical features
- **Total P1 items:** 33 — strongly recommended; cut individually if pressed
- **Total P2 items:** 19 — nice to have; defer to v0.1.1 patch

If a typical P0 item takes 2-4 hours of focused work, the P0 set alone is roughly **140-280 hours** of coding — which aligns with the 8-12 weeks of part-time effort in the MVP plan (assuming 12-20 hours/week available).

Combine with the 60-80 hours of data seeding work in weeks 3-6 and you land at the right total for the timeline.

---

## How to use this list

1. Paste each section into your tracker (Linear, GitHub Issues, Notion, plaintext checklist — doesn't matter).
2. Group sequentially: do all P0s within a section before moving to P1s — sections roughly mirror dependency order.
3. When tempted to add something not on the list, write it down somewhere as a v0.5 candidate. Do not add it to v0.1.
4. The seeding work (covered separately in the MVP plan) runs in parallel with the build — do an hour of seeding for every 2-3 hours of coding.
