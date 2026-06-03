-- search_recipes: discover public recipes by title or by paint name/brand used in steps.
-- Mirrors the search_paints RPC pattern. security invoker so RLS still applies.

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
        from   recipe_steps s
        join   paints       p on p.id = s.target_paint_id
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
