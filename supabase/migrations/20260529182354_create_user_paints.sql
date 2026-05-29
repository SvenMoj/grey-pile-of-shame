create table user_paints (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users (id) on delete cascade,
  catalog_paint_id text        references paints (id) on delete set null,
  custom_name      text,
  custom_brand     text,
  custom_hex       text,        -- 6-char hex w/o #; LAB computed app-side via culori (§5)
  state            text        not null default 'owned',
  added_at         timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint user_paints_state_check     check (state in ('owned', 'wishlist', 'running_low')),
  constraint user_paints_identity_check  check (catalog_paint_id is not null or custom_name is not null)
);

create trigger user_paints_set_updated_at
  before update on user_paints
  for each row execute function set_updated_at();
