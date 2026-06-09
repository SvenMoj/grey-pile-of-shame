-- Update search_paints RPC to filter out brands hidden by the current user.
-- Anonymous callers (auth.uid() null) see all brands; authenticated users
-- see only brands not in their profiles.hidden_brands array.
-- Signature is unchanged — no client code changes required.

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
    and (
      auth.uid() is null
      or p.brand <> all(
        coalesce((select hidden_brands from profiles where id = auth.uid()), '{}')
      )
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
