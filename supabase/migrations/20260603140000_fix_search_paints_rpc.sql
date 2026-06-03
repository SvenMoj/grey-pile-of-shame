-- Rewrite search_paints in language sql to avoid SET LOCAL pg_trgm GUC which
-- is not settable by the anon role and causes the function to error silently.
-- The default word_similarity_threshold of 0.6 is sufficient; "mephist"
-- scores ~0.71 against "Mephiston Red" so short partials still match.
-- Adds explicit GRANT to anon and authenticated for belt-and-suspenders.
create or replace function search_paints(search_query text, result_limit int default 20)
returns table (id text, brand text, name text, hex text, "range" text)
language sql stable
as $$
  select p.id, p.brand, p.name, p.hex, p.range
  from paints p
  where p.status = 'active'
    and (
      p.name  ilike '%' || search_query || '%'
      or p.brand ilike '%' || search_query || '%'
      or search_query <% p.name
      or search_query <% p.brand
    )
  order by
    greatest(
      word_similarity(search_query, p.name),
      word_similarity(search_query, p.brand)
    ) desc,
    p.brand,
    p.name
  limit result_limit;
$$;

grant execute on function search_paints(text, int) to anon, authenticated;
