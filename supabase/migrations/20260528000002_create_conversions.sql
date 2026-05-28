-- confidence: 0.0 – 1.0 (1.0 = perfect official match, 0.0 = pure hex guess)
-- source_type: official_chart | community | hex_derived

create table conversions (
  id              uuid        primary key default gen_random_uuid(),
  paint_a_id      text        not null references paints (id),
  paint_b_id      text        not null references paints (id),
  confidence      numeric     not null,
  source_type     text        not null,
  source_url      text,
  notes           text,
  verified_count  integer     not null default 0,
  disputed_count  integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint conversions_no_self_loop    check (paint_a_id <> paint_b_id),
  constraint conversions_confidence_range check (confidence >= 0 and confidence <= 1),
  constraint conversions_source_type_check check (
    source_type in ('official_chart', 'community', 'hex_derived')
  ),
  constraint conversions_unique_pair unique (paint_a_id, paint_b_id)
);

create trigger conversions_set_updated_at
  before update on conversions
  for each row execute function set_updated_at();
