create table conversion_evidence_photos (
  id            uuid        primary key default gen_random_uuid(),
  conversion_id uuid        not null references conversions (id) on delete cascade,
  photo_url     text        not null,
  caption       text,
  created_at    timestamptz not null default now()
);
