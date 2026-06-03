-- search_paints(search_query, result_limit): fuzzy paint catalog search.
--
-- Uses pg_trgm word_similarity (<%  operator) so typos and partial matches
-- are both returned and ranked by closeness.  Exact substring matches
-- (ilike '%…%') are always included so autocomplete still works for good
-- typists.  GIN trigram indexes on paints(name) and paints(brand) make this
-- fast even over large catalogs.
--
-- word_similarity_threshold is lowered to 0.3 so short or misspelled queries
-- still hit reasonable results without flooding the list with noise.
create or replace function search_paints(search_query text, result_limit int default 20)
returns table (id text, brand text, name text, hex text, "range" text)
language plpgsql stable as $$
begin
  set local pg_trgm.word_similarity_threshold = 0.3;
  return query
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
end;
$$;
