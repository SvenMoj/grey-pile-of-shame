@AGENTS.md

# grey-pile-of-shame

Cross-brand miniature paint conversion lookup — Next.js 16 App Router, TypeScript, Tailwind v4, Supabase (Postgres), Vercel.

## Commands

- `pnpm dev` — dev server
- `pnpm build` — production build
- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript check (no emit)
- `pnpm format:check` — Prettier check
- `pnpm db:types` — regenerate Supabase types from live schema
- `pnpm test` — run tests once (Vitest)
- `pnpm test:watch` — run tests in watch mode

## TDD approach

Write the test first, make it pass, then refactor.

1. **Red** — write a failing test that describes the desired behavior
2. **Green** — write the minimal code to make it pass
3. **Refactor** — clean up without breaking the test

Test files live next to the code they test (`foo.ts` → `foo.test.ts`). Use Vitest. Run `pnpm test` before committing — all tests must pass. Never skip or comment out a failing test to unblock a commit; fix the root cause.

## Key conventions

- Package manager: pnpm 9
- App Router only — no Pages Router
- Supabase clients: `lib/supabase/server.ts` (server components/route handlers), `lib/supabase/client.ts` (browser), `lib/supabase/admin.ts` (service role, server-only)
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

Installed primitives: `button`, `input`, `label`, `select`, `textarea`, `card`, `alert`, `badge`, `separator`, `collapsible`, `table`, `sonner`.

```bash
pnpm dlx shadcn@latest add dialog   # example: add a new primitive
```

### UI conventions

- **Use shadcn components** for buttons, inputs, cards, alerts, tables — not raw `<button>` / `<input>` with ad-hoc Tailwind
- **Icons:** lucide-react; import named icons (`Pencil`, `ChevronRight`, etc.)
- **Semantic colors:** prefer theme tokens (`bg-primary`, `text-muted-foreground`, `border-border`) over hard-coded grays
- **Selected list rows:** [`lib/ui/list-row.ts`](lib/ui/list-row.ts) → `listRowClass(isSelected)` (`bg-primary` when active)
- **Toasts:** `toast()` from `sonner` (see [`app/collection/Celebration.tsx`](app/collection/Celebration.tsx))
- **Forms:** native `FormData` + server actions — no react-hook-form. Shared field helpers:
  - [`app/pile/Field.tsx`](app/pile/Field.tsx) — shadcn `Label` + `Input`
  - [`app/pile/SelectField.tsx`](app/pile/SelectField.tsx) — native `<select>` styled for FormData compatibility (use shadcn `Select` only when controlled state is needed)

### Domain components (`app/_components/`)

| Component         | Purpose                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `StatePill`       | Badge for current painting stage                                                                |
| `StageStepper`    | Fixed-width “Move to {next}” advance button                                                     |
| `StateLegend`     | Color key (pile + collection page headers)                                                      |
| `ModelItemRow`    | Model list layout: name → state pill → actions row; advance button right-aligned in `w-40` slot |
| `CompletionBadge` | Green “Done” badge                                                                              |
| `SiteHeader`      | App nav                                                                                         |

### Painting-state colors

Single source of truth: [`lib/pile/display.ts`](lib/pile/display.ts)

- `STATE_LABELS` — display names
- `STATE_STYLES` — Tailwind classes per stage; **red → orange → yellow → green** progression (no blue/purple)
  - `.pill` — badges & advance buttons
  - `.bar` — progress bar segments & legend swatches

Always import from `display.ts`; do not duplicate stage colors elsewhere.
