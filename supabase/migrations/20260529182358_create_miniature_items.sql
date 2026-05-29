create table miniature_items (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  kit_id       text,                                    -- optional retail kit / SKU ref (no FK yet)
  display_name text        not null,
  game         text,
  faction      text,
  unit_size    integer     not null default 1,          -- 1 for a single model; >1 for a squad / unit
  state        text        not null default 'unbuilt',
  point_value  integer,
  created_at   timestamptz not null default now(),
  painted_at   timestamptz,
  updated_at   timestamptz not null default now(),

  constraint miniature_items_state_check
    check (state in ('unbuilt', 'built', 'primed', 'in_progress', 'painted'))
);

create trigger miniature_items_set_updated_at
  before update on miniature_items
  for each row execute function set_updated_at();
