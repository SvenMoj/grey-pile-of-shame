-- Distinct brand list for the admin paints filter, unaffected by the
-- PostgREST 1000-row response cap that a plain select("brand") hits.
create or replace function paint_brands()
returns setof text
language sql
stable
as $$
  select distinct brand from paints order by brand;
$$;
