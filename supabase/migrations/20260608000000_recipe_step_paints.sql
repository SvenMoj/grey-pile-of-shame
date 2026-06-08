-- Introduce recipe_step_paints: one row per paint component in a step's mix.
-- A single-paint step is one component with ratio=1, position=0.
--
-- Migration order:
--   1. Create table + indexes + trigger
--   2. Enable RLS + add policies
--   3. Backfill existing steps (position=0, ratio=1)
--   4. Drop old recipe_steps.target_paint_id/target_hex columns + their constraint
--   5. Rewrite search_recipes to join through recipe_step_paints (avoids silent breakage)
--   6. Rewrite save_recipe_steps to insert nested paint components

-- ─── 1. Create table ─────────────────────────────────────────────────────────

create table recipe_step_paints (
  id         uuid        primary key default gen_random_uuid(),
  step_id    uuid        not null references recipe_steps(id) on delete cascade,
  position   int         not null,
  paint_id   text        references paints(id) on delete set null,
  hex        text,
  ratio      int         not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint recipe_step_paints_target_check check (paint_id is not null or hex is not null),
  constraint recipe_step_paints_ratio_check  check (ratio >= 1),
  unique (step_id, position)
);

create index recipe_step_paints_step_id_idx  on recipe_step_paints (step_id);
create index recipe_step_paints_paint_id_idx on recipe_step_paints (paint_id);

create trigger recipe_step_paints_set_updated_at
  before update on recipe_step_paints
  for each row execute function set_updated_at();

-- ─── 2. RLS ──────────────────────────────────────────────────────────────────

alter table recipe_step_paints enable row level security;

-- Read: mirrors parent recipe visibility
create policy "recipe_step_paints_read"
  on recipe_step_paints for select
  to anon, authenticated
  using (exists (
    select 1
    from   recipe_steps rs
    join   recipes      r  on r.id = rs.recipe_id
    where  rs.id = recipe_step_paints.step_id
      and  (r.visibility = 'public' or r.author_user_id = auth.uid())
  ));

-- Write: requires ownership of the parent recipe
create policy "recipe_step_paints_owner_write"
  on recipe_step_paints for all
  to authenticated
  using (exists (
    select 1
    from   recipe_steps rs
    join   recipes      r  on r.id = rs.recipe_id
    where  rs.id = recipe_step_paints.step_id
      and  r.author_user_id = auth.uid()
  ))
  with check (exists (
    select 1
    from   recipe_steps rs
    join   recipes      r  on r.id = rs.recipe_id
    where  rs.id = recipe_step_paints.step_id
      and  r.author_user_id = auth.uid()
  ));

-- ─── 3. Backfill existing steps ──────────────────────────────────────────────
-- Every existing step satisfies target_paint_id IS NOT NULL OR target_hex IS NOT NULL
-- (enforced by the old recipe_steps_target_check), so all inserted rows satisfy the
-- new recipe_step_paints_target_check.

insert into recipe_step_paints (step_id, position, paint_id, hex, ratio)
select id, 0, target_paint_id, target_hex, 1
from   recipe_steps;

-- ─── 4. Drop old columns from recipe_steps ───────────────────────────────────
-- Drop the check constraint first; then dropping target_paint_id auto-removes the FK.

alter table recipe_steps drop constraint recipe_steps_target_check;
alter table recipe_steps drop column target_paint_id;
alter table recipe_steps drop column target_hex;

-- ─── 5. Rewrite search_recipes ────────────────────────────────────────────────
-- The old body joined `paints p on p.id = s.target_paint_id` — that column is gone.
-- The new body joins through recipe_step_paints instead.

create or replace function search_recipes(
  search_query text    default null,
  result_limit integer default 50
)
returns table (
  id              uuid,
  title           text,
  visibility      text,
  author_user_id  uuid,
  cover_image_url text,
  step_count      integer
)
language sql
stable
security invoker
as $$
  select
    r.id,
    r.title,
    r.visibility,
    r.author_user_id,
    (
      select i.image_url
      from   recipe_images i
      where  i.recipe_id = r.id
      order  by i.sort_order
      limit  1
    ) as cover_image_url,
    (
      select count(*)::integer
      from   recipe_steps s
      where  s.recipe_id = r.id
    ) as step_count
  from recipes r
  where r.visibility = 'public'
    and (
      search_query is null
      or search_query = ''
      or r.title ilike '%' || search_query || '%'
      or exists (
        select 1
        from   recipe_steps       s
        join   recipe_step_paints sp on sp.step_id  = s.id
        join   paints             p  on p.id        = sp.paint_id
        where  s.recipe_id = r.id
          and  (
            p.name  ilike '%' || search_query || '%'
            or p.brand ilike '%' || search_query || '%'
          )
      )
    )
  order by r.updated_at desc
  limit result_limit;
$$;

grant execute on function search_recipes(text, integer) to anon, authenticated;

-- ─── 6. Rewrite save_recipe_steps ─────────────────────────────────────────────
-- The old body inserted target_paint_id/target_hex directly into recipe_steps.
-- The new body captures each new step id (returning id into v_step_id) and then
-- inserts the nested paints array into recipe_step_paints.
--
-- Per-step jsonb shape expected by the client:
--   { role, technique_note, area_note,
--     paints: [{ paint_id, hex, ratio }, ...] }
--
-- Signature is unchanged so the DB type generator output stays stable.

create or replace function save_recipe_steps(
  p_recipe_id uuid,
  p_steps     jsonb
)
returns void
language plpgsql
security invoker
as $$
declare
  v_step     jsonb;
  v_order    integer := 0;
  v_step_id  uuid;
  v_paint    jsonb;
  v_pos      integer;
begin
  -- Delete all existing steps; cascade removes their recipe_step_paints rows.
  delete from recipe_steps where recipe_id = p_recipe_id;

  for v_step in select * from jsonb_array_elements(p_steps)
  loop
    insert into recipe_steps (
      recipe_id,
      step_order,
      role,
      technique_note,
      area_note
    ) values (
      p_recipe_id,
      v_order,
      (v_step->>'role'),
      nullif(v_step->>'technique_note', ''),
      nullif(v_step->>'area_note', '')
    )
    returning id into v_step_id;

    v_pos := 0;
    for v_paint in select * from jsonb_array_elements(v_step->'paints')
    loop
      insert into recipe_step_paints (
        step_id,
        position,
        paint_id,
        hex,
        ratio
      ) values (
        v_step_id,
        v_pos,
        nullif(v_paint->>'paint_id', ''),
        nullif(v_paint->>'hex', ''),
        coalesce((v_paint->>'ratio')::int, 1)
      );
      v_pos := v_pos + 1;
    end loop;

    v_order := v_order + 1;
  end loop;
end;
$$;

grant execute on function save_recipe_steps(uuid, jsonb) to authenticated;
