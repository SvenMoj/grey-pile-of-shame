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
