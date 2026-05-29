create table recipes (
  id             uuid        primary key default gen_random_uuid(),
  author_user_id uuid        not null references auth.users (id) on delete cascade,
  title          text        not null,
  description    text,
  visibility     text        not null default 'private',
  source_type    text,        -- e.g. 'official', 'community', 'personal'
  source_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint recipes_visibility_check check (visibility in ('private', 'public'))
);

create trigger recipes_set_updated_at
  before update on recipes
  for each row execute function set_updated_at();
