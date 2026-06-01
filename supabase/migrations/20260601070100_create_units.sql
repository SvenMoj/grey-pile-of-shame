create table units (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  army_id    uuid        references armies (id) on delete set null, -- null = loose unit (no army)
  name       text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger units_set_updated_at
  before update on units
  for each row execute function set_updated_at();
