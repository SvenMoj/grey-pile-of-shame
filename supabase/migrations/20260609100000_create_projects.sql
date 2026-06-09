-- projects: admin-authored showcase of a single painted model.
-- The headline content object; replaces the pile/collection tracker.
-- Each project has a narrative (title, summary, body), a slug for clean URLs,
-- optional game/faction metadata, and a draft/published status gate.

create table projects (
  id             uuid        primary key default gen_random_uuid(),
  author_user_id uuid        not null references auth.users (id) on delete cascade,
  title          text        not null,
  slug           text        not null unique,
  summary        text,       -- short teaser for cards / meta description
  body           text,       -- full narrative (markdown)
  status         text        not null default 'draft'
                             check (status in ('draft', 'published')),
  game           text,
  faction        text,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index projects_slug_idx on projects (slug);

create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

alter table projects enable row level security;

-- Public read for published projects (anonymous + authenticated).
create policy "projects_public_read"
  on projects for select
  to anon, authenticated
  using (status = 'published');

-- Author (admin) can read all own projects, including drafts.
create policy "projects_author_read"
  on projects for select
  to authenticated
  using (author_user_id = auth.uid());

-- Author can insert / update / delete their own projects.
create policy "projects_author_write"
  on projects for all
  to authenticated
  using (author_user_id = auth.uid())
  with check (author_user_id = auth.uid());
