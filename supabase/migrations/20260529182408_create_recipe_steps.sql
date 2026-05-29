create table recipe_steps (
  id              uuid    primary key default gen_random_uuid(),
  recipe_id       uuid    not null references recipes (id) on delete cascade,
  step_order      integer not null,   -- spec names this "order"; renamed to avoid reserved word
  role            text    not null,
  target_paint_id text    references paints (id) on delete set null,
  target_hex      text,               -- 6-char hex w/o #; used when no catalog paint is specified
  technique_note  text,
  area_note       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint recipe_steps_role_check check (
    role in ('basecoat', 'layer', 'highlight', 'edge_highlight', 'shade', 'drybrush', 'glaze', 'wash', 'other')
  ),
  constraint recipe_steps_unique_order  unique (recipe_id, step_order),
  constraint recipe_steps_target_check  check (target_paint_id is not null or target_hex is not null)
);

create trigger recipe_steps_set_updated_at
  before update on recipe_steps
  for each row execute function set_updated_at();
