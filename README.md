# grey-pile-of-shame

Cross-brand miniature paint conversion lookup. Find equivalents for any paint across Citadel, Vallejo, Army Painter, Scale75, and more — with confidence scores and photo evidence.

## Local setup

**Prerequisites:** Node 20 (see `.nvmrc`), pnpm 9+

```bash
# Install pnpm if you don't have it
npm install -g pnpm@9

# Install dependencies
pnpm install

# Copy env template and fill in your Supabase credentials
cp .env.example .env.local

# Run the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database (Supabase)

Schema is managed via the Supabase migrations CLI.

```bash
# Install Supabase CLI (macOS)
brew install supabase/tap/supabase

# Link to your cloud project (one-time)
supabase link --project-ref <your-project-ref>

# Apply migrations locally
supabase start
supabase db reset

# Apply migrations to the linked cloud project
supabase db push

# Regenerate TypeScript types after schema changes
pnpm db:types
```

## Scripts

| Command             | What it does                                                 |
| ------------------- | ------------------------------------------------------------ |
| `pnpm dev`          | Next.js dev server on :3000                                  |
| `pnpm build`        | Production build                                             |
| `pnpm lint`         | ESLint                                                       |
| `pnpm typecheck`    | TypeScript type check (no emit)                              |
| `pnpm format`       | Prettier (write)                                             |
| `pnpm format:check` | Prettier (check only, used in CI)                            |
| `pnpm db:types`     | Regenerate `lib/supabase/database.types.ts` from live schema |

## Tech stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styles:** Tailwind v4
- **Database:** Supabase (Postgres, Frankfurt region)
- **Hosting:** Vercel
- **Email:** Resend
- **Analytics:** Plausible (cookieless)
- **Storage:** Supabase Storage
