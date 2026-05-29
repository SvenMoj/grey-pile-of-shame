create table recipe_applications (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users (id) on delete cascade,
  miniature_item_id uuid        not null references miniature_items (id) on delete cascade,
  recipe_id         uuid        not null references recipes (id) on delete cascade,
  status            text        not null default 'planned',
  applied_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint recipe_applications_status_check check (status in ('planned', 'in_progress', 'done')),
  constraint recipe_applications_unique_pair  unique (miniature_item_id, recipe_id)
);

create trigger recipe_applications_set_updated_at
  before update on recipe_applications
  for each row execute function set_updated_at();
