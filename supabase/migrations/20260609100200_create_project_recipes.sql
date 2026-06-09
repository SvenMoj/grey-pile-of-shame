-- project_recipes: links a project to reusable recipes, tagged with a painting area.
-- Replaces recipe_applications (the old M:N "applied to a model" bag).
-- A project can reference many recipes; each reference has a free-text area label
-- (e.g. 'skin', 'armor', 'base', 'cloth', 'weapon') and an ordering.

create table project_recipes (
  id           uuid        primary key default gen_random_uuid(),
  project_id   uuid        not null references projects (id) on delete cascade,
  recipe_id    uuid        not null references recipes (id) on delete cascade,
  area         text        not null,   -- free text: skin / armor / base / ...
  sort_order   integer     not null default 0,
  note         text,                   -- optional per-link annotation
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint project_recipes_unique_pair unique (project_id, recipe_id)
);

create trigger project_recipes_set_updated_at
  before update on project_recipes
  for each row execute function set_updated_at();

alter table project_recipes enable row level security;

-- Public read: visible when the parent project is published.
create policy "project_recipes_public_read"
  on project_recipes for select
  to anon, authenticated
  using (exists (
    select 1 from projects p
    where p.id = project_recipes.project_id
      and (p.status = 'published' or p.author_user_id = auth.uid())
  ));

-- Author (admin) can insert / update / delete their project's recipe links.
create policy "project_recipes_author_write"
  on project_recipes for all
  to authenticated
  using (exists (
    select 1 from projects p
    where p.id = project_recipes.project_id and p.author_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from projects p
    where p.id = project_recipes.project_id and p.author_user_id = auth.uid()
  ));
