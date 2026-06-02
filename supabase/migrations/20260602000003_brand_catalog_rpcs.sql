-- brand_overview(): one row per brand with paint count, range count, and
-- a sample of up to 8 hex colours (deterministic: first 8 paints by name).
-- Used by the /brands index page.
create or replace function brand_overview()
returns table(brand text, paint_count bigint, range_count bigint, sample_hexes text[])
language sql stable as $$
  with samples as (
    select
      brand,
      array_agg(hex order by rn) as hexes
    from (
      select
        brand,
        hex,
        row_number() over (partition by brand order by name) as rn
      from paints
      where hex is not null
    ) ranked
    where rn <= 8
    group by brand
  ),
  counts as (
    select brand, count(*) as paint_count, count(distinct range) as range_count
    from paints
    group by brand
  )
  select
    c.brand,
    c.paint_count,
    c.range_count,
    coalesce(s.hexes, '{}') as sample_hexes
  from counts c
  left join samples s on s.brand = c.brand
  order by c.brand;
$$;

-- paints_by_brand(p_brand): all paints for a given brand ordered by range then
-- name. Uses an RPC to avoid the PostgREST 1000-row default cap.
-- Used by the /brands/[brand] detail page.
create or replace function paints_by_brand(p_brand text)
returns setof paints
language sql stable as $$
  select * from paints where brand = p_brand order by range nulls last, name;
$$;
