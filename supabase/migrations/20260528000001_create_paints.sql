-- Shared trigger function: update `updated_at` on every row modification.
-- Reused by paints, conversions.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table paints (
  id               text        primary key,               -- slug, e.g. "citadel-mephiston-red"
  brand            text        not null,
  range            text,
  name             text        not null,
  sku_code         text,
  hex              text,                                   -- 6-char hex without #, e.g. "7C0A02"
  lab_l            numeric,
  lab_a            numeric,
  lab_b            numeric,
  size_ml          integer,
  type             text,                                   -- base / layer / wash / contrast / …
  status           text        not null default 'active',  -- active | discontinued
  version          integer     not null default 1,
  discontinued_date date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint paints_status_check check (status in ('active', 'discontinued'))
);

create trigger paints_set_updated_at
  before update on paints
  for each row execute function set_updated_at();
