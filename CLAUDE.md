@AGENTS.md

# grey-pile-of-shame

Admin content-authoring & recipe-management hub for miniature painting — Next.js 16 App Router, TypeScript, Tailwind v4, Supabase (Postgres), Vercel.

**Direction:** The product is being repositioned around **recipe & content authoring by admin users**. The cross-brand paint catalog and conversion data now serve as a reference library for recipes rather than the headline product. The original multi-user "pile of shame" tracker (pile/collection/inventory + open magic-link signup) is **legacy** and being wound down — avoid investing in it; build new work around the content/recipe model. A future pivot toward a **public blog / content website** is possible, so favor generality in the content data model.

## Commands

- `pnpm dev` — dev server
- `pnpm build` — production build
- `pnpm start` — start production server
- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript check (no emit)
- `pnpm format` — Prettier format (write)
- `pnpm format:check` — Prettier check
- `pnpm db:types` — regenerate Supabase types from live schema
- `pnpm test` — run tests once (Vitest)
- `pnpm test:watch` — run tests in watch mode
- `pnpm seed:csv` — seed paint catalog from CSV (`scripts/seed-from-csv.ts`)

## Product areas

| Area                                | Routes / modules                                     | Status                                                 |
| ----------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| **Recipes**                         | `app/recipes/`, `lib/recipes/`                       | ✅ Core — active development                           |
| **Studio** (share-image generation) | `app/studio/`, `lib/studio/`                         | ✅ Core                                                |
| **Admin catalog tooling**           | `app/admin/`, `lib/admin/`                           | ✅ Core                                                |
| **Conversion charts / SEO**         | `/convert`, `/brands`, `app/convert/`, `app/brands/` | ✅ Core (reference data for recipes; also SEO surface) |
| Pile tracker                        | `/pile`, `lib/pile/`                                 | ⚠️ Legacy — wind down                                  |
| Collection & achievements           | `/collection`                                        | ⚠️ Legacy — wind down                                  |
| Inventory                           | `/inventory`, `lib/inventory/`                       | ⚠️ Legacy — wind down                                  |
| Open multi-user signup              | `/login`, `/set-password`, `/onboarding`             | ⚠️ Legacy — being phased out                           |

## Access model

There are two tiers of access; **admin-only content authoring is the intended future state**.

**Admin** (`/admin/*`)

- Gated in `proxy.ts` (Next 16's middleware equivalent — there is **no `middleware.ts`**) and `lib/admin/auth.ts` (`getAdminUserOrRedirect()`), both checking `user.email === process.env.ADMIN_EMAIL`.
- No DB role column; admin is a single `ADMIN_EMAIL` env var.
- Callback at `/auth/callback` routes the admin email directly to `/admin/paints`.

**Regular users** (all other authenticated routes)

- Gated by `getUserOrRedirect()` (`lib/user/auth.ts`); also enforces the `/set-password` step for new accounts.
- Login: email + password **or** magic-link OTP (Supabase Auth).
- **Note:** open multi-user signup is being phased out — do not build new consumer-account features.

## TDD approach

Write the test first, make it pass, then refactor.

1. **Red** — write a failing test that describes the desired behavior
2. **Green** — write the minimal code to make it pass
3. **Refactor** — clean up without breaking the test

Test files live next to the code they test (`foo.ts` → `foo.test.ts`). Use Vitest. Run `pnpm test` before committing — all tests must pass. Never skip or comment out a failing test to unblock a commit; fix the root cause.

Vitest only discovers tests under `lib/**` and `scripts/**` (see `vitest.config.ts`, `environment: "node"`). Tests outside those directories will not run.

After every implementation task run `pnpm typecheck`, `pnpm lint`, and `pnpm format:check` — CI will fail if any of these do not pass.

## Key conventions

- Package manager: pnpm 9
- App Router only — no Pages Router
- Supabase clients:
  - `lib/supabase/server.ts` — server components / route handlers (respects RLS)
  - `lib/supabase/client.ts` — browser
  - `lib/supabase/admin.ts` — service role, server-only (bypasses RLS; admin/seed only)
  - `lib/supabase/public.ts` — anon public-read (conversion charts, SEO pages)
  - `lib/supabase/proxy.ts` — session-refresh client used inside `proxy.ts`
- Schema changes go in `supabase/migrations/` via `supabase db migration new <name>`, never hand-edited in the dashboard
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never import `lib/supabase/admin.ts` from a client component

## Design system (shadcn/ui)

UI is built on **[shadcn/ui](https://ui.shadcn.com)** (Radix Nova style, neutral base color) with **Tailwind v4**, **lucide-react** icons, and **next-themes** (system light/dark via `.dark` class).

### Setup & adding components

- Config: [`components.json`](components.json)
- Primitives: [`components/ui/`](components/ui/) — do not edit by hand unless customizing; prefer `pnpm dlx shadcn@latest add <name>` for new ones
- `cn()` helper: [`lib/utils.ts`](lib/utils.ts) — merge Tailwind classes with `cn(...)`
- Theme tokens & base styles: [`app/globals.css`](app/globals.css) (CSS variables, Geist Sans via `--font-geist-sans`)
- Root providers: [`components/theme-provider.tsx`](components/theme-provider.tsx) + `<Toaster />` in [`app/layout.tsx`](app/layout.tsx)

Installed primitives: `alert`, `alert-dialog`, `badge`, `button`, `card`, `collapsible`, `dropdown-menu`, `input`, `label`, `select`, `separator`, `sheet`, `sonner`, `switch`, `table`, `textarea`.

```bash
pnpm dlx shadcn@latest add dialog   # example: add a new primitive
```

### UI conventions

- **Use shadcn components** for buttons, inputs, cards, alerts, tables — not raw `<button>` / `<input>` with ad-hoc Tailwind
- **Icons:** lucide-react; import named icons (`Pencil`, `ChevronRight`, etc.)
- **Semantic colors:** prefer theme tokens (`bg-primary`, `text-muted-foreground`, `border-border`) over hard-coded grays
- **Selected list rows:** [`lib/ui/list-row.ts`](lib/ui/list-row.ts) → `listRowClass(isSelected)` (`bg-primary` when active)
- **Toasts:** `toast()` from `sonner`
- **Forms:** native `FormData` + server actions — no react-hook-form. Shared field helpers:
  - [`components/Field.tsx`](components/Field.tsx) — shadcn `Label` + `Input`
  - [`components/SelectField.tsx`](components/SelectField.tsx) — native `<select>` styled for FormData compatibility (use shadcn `Select` only when controlled state is needed)

### Shared domain components (`components/`)

All shared domain components live in the root `components/` folder alongside the shadcn primitives in `components/ui/`. Import them via `@/components/<Name>`.

**Recipe / content components** live under `app/recipes/` (co-located with their routes), not in `components/`:

| Component            | Location                             | Purpose                                               |
| -------------------- | ------------------------------------ | ----------------------------------------------------- |
| `RecipeEditor`       | `app/recipes/RecipeEditor.tsx`       | Full recipe create/edit form                          |
| `StepEditor`         | `app/recipes/StepEditor.tsx`         | Per-step paint-mix editor                             |
| `RecipeImageGallery` | `app/recipes/RecipeImageGallery.tsx` | Edit-mode image gallery (uploads to Storage)          |
| `StagedImageGallery` | `app/recipes/StagedImageGallery.tsx` | Create-mode staged images (flushed after recipe save) |
| `RecipeSearchBox`    | `app/recipes/RecipeSearchBox.tsx`    | Recipe search input                                   |

**Shared components:**

| Component         | Purpose                                                               |
| ----------------- | --------------------------------------------------------------------- |
| `SiteHeader`      | App nav                                                               |
| `Breadcrumbs`     | Route breadcrumbs                                                     |
| `PaintSearch`     | Debounced catalog paint search (used in recipe steps)                 |
| `PaintSwatch`     | Color swatch for a paint                                              |
| `ConversionTable` | Cross-brand conversion table                                          |
| `Field`           | Form field: shadcn `Label` + `Input`                                  |
| `SelectField`     | Form select: shadcn `Label` + native `<select>` (FormData-compatible) |
| `JsonLd`          | Structured data injection for SEO pages                               |
| `ModeToggle`      | Light/dark mode toggle                                                |

**Legacy tracker components** (in `components/` — avoid adding to these):

| Component         | Purpose                                                                   |
| ----------------- | ------------------------------------------------------------------------- |
| `StatePill`       | Badge for current painting stage                                          |
| `StageStepper`    | Fixed-width "Move to {next}" advance button                               |
| `StateLegend`     | Color key (pile + collection page headers)                                |
| `ModelItemRow`    | Model list layout: name → state pill → actions row                        |
| `CompletionBadge` | Green "Done" badge                                                        |
| `ProgressBar`     | Multi-segment stacked progress bar (one colored slice per painting state) |

### Painting-state colors

Single source of truth: [`lib/pile/display.ts`](lib/pile/display.ts) (used by legacy tracker + Studio share-image generation)

- `STATE_LABELS` — display names
- `STATE_STYLES` — Tailwind classes per stage; **red → orange → yellow → green** progression (no blue/purple)
  - `.pill` — badges & advance buttons
  - `.bar` — progress bar segments & legend swatches
- `STATE_HEX` — literal hex values per stage (for Satori / next-og image generation, where Tailwind classes cannot be resolved)

Always import from `display.ts`; do not duplicate stage colors elsewhere.
