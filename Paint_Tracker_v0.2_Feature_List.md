# Paint Tracker — v0.2 Feature List (Aligned to Core Loop Spec)

Checklist-style breakdown of every discrete piece of work for the v0.2 codebase, refactored to align with the **Grey Pile of Shame (GPoS)** Core Loop roadmap. Each item is sized to roughly one focused work session (a few hours to a day).

**Priority Key:**

- **P0** — Blocks Core Loop / Closed Beta (Months 1-2); absolute baseline functionality.
- **P1** — Required for Public Funnel & Open Beta (Months 3-4); strong community or UX drivers.
- **P2** — Nice to have / Launch Polish (Months 5-6); deferrable to post-launch patches.

---

## 1. Project Foundation & Color Engine

- [x] **P0** — Set up Next.js 15 (App Router) + TypeScript project
- [x] **P0** — Add Tailwind CSS configuration
- [x] **P0** — Set up Vercel deployment from GitHub
- [ ] **P0** — Register domain and configure DNS (point to Vercel)
- [x] **P0** — Configure environment variables (`.env.local`, Vercel project envs)
- [x] **P0** — Set up Supabase Frankfurt project (free tier)
- [x] **P0** — Connect Next.js to Supabase via `@supabase/supabase-js`
- [x] **P1** — Configure GitHub Actions or Vercel build checks for type errors and lint
- [x] **P2** — Set up Prettier + ESLint with sensible defaults
- [x] **P2** — Add a `README.md` documenting local setup
- [ ] **P0** — Install and configure `culori` library for CIEDE2000 ($\DeltaE_{00}$) calculations

---

## 2. Core Loop Database Schema (Refactored V2)

- [x] **P0** — `paints` table with columns: `id` (slug), `brand`, `range`, `name`, `sku_code`, `hex`, `lab_l`, `lab_a`, `lab_b`, `size_ml`, `type`, `status`, `version`, `discontinued_date`, `created_at`, `updated_at`
- [x] **P0** — `conversions` table: `id`, `paint_a_id`, `paint_b_id`, `confidence`, `source_type`, `source_url`, `notes`, `verified_count`, `disputed_count`, `created_at`, `updated_at`
- [x] **P0** — `conversion_evidence_photos` table: `id`, `conversion_id`, `photo_url`, `caption`, `created_at`
- [x] **P0** — `submissions` table: `id`, `paint_a_id`, `paint_b_id`, `submitter_email`, `email_verified_at`, `photo_url`, `notes`, `status`, `created_at`, `reviewed_at`
- [x] **P0** — Database indexes on `paints.name`, `paints.brand`, `conversions.paint_a_id`, `conversions.paint_b_id`
- [x] **P0** — Supabase Row Level Security (RLS) policies (public read for paints/conversions; admin-only write)
- [x] **P1** — Migration tooling decision and setup (Supabase migrations CLI or Drizzle)
- [x] **P1** — Seed scripts that can rebuild the DB from CSV exports
- [ ] **P1** — Daily automated backups verified working in Supabase dashboard
- [ ] **P0** — **New Table:** `user_paints` (`id`, `user_id`, `catalog_paint_id`, `custom_name`, `custom_brand`, `custom_hex`, `state` [owned/wishlist/running_low], `added_at`) + RLS user-isolation policies
- [ ] **P0** — **New Table:** `miniature_items` (`id`, `user_id`, `kit_id`, `display_name`, `game`, `faction`, `unit_size`, `state` [unbuilt/built/primed/in_progress/painted], `created_at`, `painted_at`, `point_value`) + RLS user-isolation policies
- [ ] **P0** — **New Table:** `recipes` (`id`, `author_user_id`, `title`, `description`, `visibility` [private/public], `source_type`, `source_url`, `created_at`) + RLS user-isolation policies
- [ ] **P0** — **New Table:** `recipe_steps` (`id`, `recipe_id`, `order`, `role` [enum], `target_paint_id`, `target_hex`, `technique_note`, `area_note`) + Foreign keys
- [ ] **P0** — **New Table:** `recipe_applications` (`id`, `user_id`, `miniature_item_id`, `recipe_id`, `status` [planned/in_progress/done], `applied_at`)

---

## 3. Authentication & User Infrastructure (Month 1 Core)

- [ ] **P0** — Configure Supabase Auth to enable Magic Link (passwordless) authentication
- [ ] **P0** — Build clean, minimal Auth Landing screen (`/login` or `/auth`) handling deep-linking tokens
- [ ] **P0** — Implement protected layout routing wrapper for application pages (`/app/*`)
- [ ] **P0** — Build account settings page shell (`/app/settings`) with immediate "Delete My Account" flow stub (DSGVO prerequisite)

---

## 4. Paint Inventory & Pile of Shame Tracking (Month 1 Core)

- [ ] **P0** — Inventory Dashboard view: List owned paints with visual hex swatches, filterable by brand/range
- [ ] **P0** — One-tap paint inventory toggle action (Add/Remove from catalog list view to minimize typing)
- [ ] **P0** — "Custom Paint" addition form (allows adding uncatalogued paints via text + color picker, auto-calculating LAB)
- [ ] **P0** — Pile of Shame Dashboard view: List miniatures grouped by status or unit/squad with state toggles
- [ ] **P0** — Add Miniature form supporting single model vs. batch unit entry (field: `unit_size`)
- [ ] **P0** — Quick linear progress updates: one-click button to step a mini from `unbuilt` -> `built` -> `primed` -> `in_progress` -> `painted`

---

## 5. Recipe Authoring & The Substitution Engine (Month 1-2 Core)

- [ ] **P0** — Recipe Creation form: input title, source metadata, and add ordered list steps dynamically
- [ ] **P0** — Step role configuration picker (explicit mapping to basecoat, layer, highlight, edge highlight, etc.)
- [ ] **P0** — **The Engine Hook:** Serverless function or DB procedure implementing CIEDE2000 ($\DeltaE_{00}$) lookup using the `culori` package
- [ ] **P0** — Role-Aware Tolerance Logic implementation: Apply strict ceiling limits ($\DeltaE \le 1.5$ for edge highlight vs. $\DeltaE \le 5.0$ for basecoat)
- [ ] **P0** — UI Resolution display: Map results into "Have Exact", "Close Match Owned (e.g., You own X — a 96% match)", or "Gap"
- [ ] **P0** — "Close the Loop" join interface: Select a miniature item and attach a recipe, writing a `recipe_application` record

---

## 6. Progressive Onboarding System (Month 2 Focus)

- [ ] **P0** — Step 0 context capture onboarding flow: "What do you main paint?" (game/faction picker) and "Which brands do you use?"
- [ ] **P0** — Onboarding Option A: Quick-count interface (simple numeric steppers per state to instantly visualize the scale of the pile)
- [ ] **P0** — Onboarding Option B: Faction-based unit selection templates mapping to popular games (turns text entry into simple taps)
- [ ] **P0** — Onboarding Option C: "Add-by-set" bulk color interface (one-click addition of major box sets like Citadel Starter or Vallejo Game sets)
- [ ] **P0** — Local storage caching layer via IndexedDB to enable lightning-fast deskside offline resilience

---

## 7. App Home & Core Synthesis Views (Month 2-4 Focus)

- [ ] **P0** — **"What can I paint right now?" Interface:** Scans owned inventory against available recipes to surface zero-purchase options
- [ ] **P1** — Home screen recommendation fallback engine ("You're just 1 paint away from being able to paint your Death Guard unit...")
- [ ] **P1** — Smart Consolidated Shopping List view: Aggregate all "Gap" steps across active projects, auto-deduplicate close reds, and display minimal true shopping needs
- [ ] **P1** — Pile-shrinking dopamine dashboard: Visualizing the actual volumetric contraction of the unpainted pile, including "Painted this month" streak counters and points trackers

---

## 8. Public Discovery Funnel & Cross-Brand Translation (Month 3 Focus)

- [ ] **P1** — Refactor Homepage (`/`) to act as an account-less public search landing page for quick paint/conversion lookups
- [ ] **P1** — Static-generation framework (`generateStaticParams`) for public paint detail pages (`/paints/[brand]/[paint]`) to optimize for SEO
- [ ] **P1** — Recipe Translation Tool: "Show this recipe in Vallejo" -> Converts an entire recipe string against a target brand instead of a user's inventory
- [ ] **P1** — Public community recipe browsing directory with instant filter for "Recipes I can paint today with my inventory"
- [ ] **P2** — Permalink-friendly conversion routes (`/paints/citadel/mephiston-red/to/vallejo-game-color`)

---

## 9. Community Contributions & Lifecycle Curation (Month 3-4 Focus)

- [ ] **P1** — Public user-submitted conversion portal on paint detail views
- [ ] **P1** — Vote-driven confidence scoring system (calculating verified vs. suggested status based on community consensus and photo proof)
- [ ] **P1** — Admin Queue panel upgrade: review, approve, reject or merge community submissions seamlessly
- [ ] **P2** — Contributor profile URLs highlighting verified contributions and reputation gamification milestones

---

## 10. Hardware Integrations: Barcode Scanning (Month 4 Focus)

- [ ] **P1** — Integration of `@zxing/browser` or HTML5 QR code scanning package for mobile camera processing
- [ ] **P1** — Paint Pot Scan action handler: Scanning barcode immediately adds matching entry to `user_paints` catalog
- [ ] **P1** — Box SKU kit scanner action handler: Resolves standard barcode arrays into direct retail miniature kits inside the pile of shame
- [ ] **P2** — Unknown barcode exception catcher loop: Prompting user to textually identify a failed scan to continuously build the crowdsourced EAN mapping dataset

---

## 11. Transactional Pipeline, Support & Analytics (Month 4-5 Focus)

- [ ] **P1** — Resend transactional mail config with domain SPF/DKIM verification parameters
- [ ] **P1** — Automated email template deployment for magic link generation and submission approval receipts
- [ ] **P1** — Caching and deployment of cookieless Plausible analytics trackers for goal milestones (Conversion Looked Up, Project Completed)
- [ ] **P1** — Live affiliate routing engine tracking integration (Fantasywelt, Element Games, Amazon) embedded directly into the Smart Shopping List
- [ ] **P2** — Patreon API webhook syncing engine to map backing tiers onto active client app UI account models

---

## 12. Complete Internationalization & SEO (Month 3/5 Focus)

- [ ] **P0** — Integration of `next-intl` configuration layer
- [ ] **P0** — Complete extraction of all hardcoded strings into English structural translation maps
- [ ] **P0** — Production of comprehensive companion German localization files
- [ ] **P1** — Automatic locale detection headers paired with HTML `hreflang` validation scripts for search indexing optimization
- [ ] **P1** — Structured JSON-LD metadata generation schemas for public catalog pages

---

## 13. UI/UX Polish, Accessibility & Compliance

- [ ] **P0** — Legally compliant Imprint/Impressum and Privacy Policy frameworks localized for DACH markets
- [ ] **P0** — 100% Mobile responsive layout architecture validation pass across multiple viewport view configurations
- [ ] **P0** — Comprehensive interactive layout loading state configurations (Skeletons, minimal spinner components)
- [ ] **P1** — Dark/Light layout mode default preferences implementation synced with native device environments
- [ ] **P1** — WCAG AA layout contrast checking compliance run across all visual assets and paint hex display cards

---

## 14. Pre-Launch Quality Assurance

- [ ] **P0** — Comprehensive manual end-to-end user path simulation across target iOS Safari and Android Chrome native browser variations
- [ ] **P0** — End-to-end confirmation of client verification loop mail performance parameters within target constraints
- [ ] **P1** — Orchestration of a structured closed beta pool cycle containing 20-30 trusted hobby painters

---

## Explicitly OUT of Scope for v0.2 Launch (The Deflection List)

These features are highly tempting but are strictly deferred to keep the core loop fast and execution sharp. Do not add these to the v0.2 milestones:

- **YouTube Tutorial Auto-Pipeline** — Scheduled for Month 8.
- **AI Shelf-Scanning Photography / Machine Vision Parsing** — Year 2 experiment.
- **Photo-of-Miniature to Recipe Mapping AI Engine** — Year 2 experiment.
- **Advanced Native Social Graph Infrastructure** (Followers, liking models, internal user comment threads) — Post-launch.
- **Native iOS Swift/Kotlin Applications** — PWA + Android TWA handles requirements adequately; native iOS is a Year 3 target.
- **Live Retail Inventory Stock API Feeds** — Scheduled for Month 10.
- **In-app Chat or Complex Multi-User Direct Messaging System** — Completely out of scope.

---

## Quick Dashboard Stats

- **Total Baseline Tasks:** ~75 work-session sized blocks.
- **Core Structural Target:** Delivers the primary personal user loop within 6-8 weeks, lighting up the public growth engine by week 12.
