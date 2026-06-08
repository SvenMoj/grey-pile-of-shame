-- reorder_recipe_steps: renumber step_order in a single transaction to avoid
-- unique(recipe_id, step_order) collisions that occur when updating one row at a time.
-- Takes an ordered array of step UUIDs; assigns step_order 0, 1, 2, … in that order.

create or replace function reorder_recipe_steps(
  p_recipe_id    uuid,
  p_ordered_ids  uuid[]
)
returns void
language plpgsql
security invoker
as $$
declare
  v_offset integer := 1000000;  -- far above any real step count
begin
  -- Phase 1: bump all steps to a collision-free range.
  update recipe_steps
  set    step_order = step_order + v_offset
  where  recipe_id = p_recipe_id;

  -- Phase 2: write final 0-based positions in the requested order.
  for i in 1 .. array_length(p_ordered_ids, 1) loop
    update recipe_steps
    set    step_order = i - 1
    where  id        = p_ordered_ids[i]
      and  recipe_id = p_recipe_id;
  end loop;
end;
$$;

grant execute on function reorder_recipe_steps(uuid, uuid[]) to authenticated;


-- reorder_recipe_images: same two-phase approach for sort_order.

create or replace function reorder_recipe_images(
  p_recipe_id    uuid,
  p_ordered_ids  uuid[]
)
returns void
language plpgsql
security invoker
as $$
declare
  v_offset integer := 1000000;
begin
  update recipe_images
  set    sort_order = sort_order + v_offset
  where  recipe_id = p_recipe_id;

  for i in 1 .. array_length(p_ordered_ids, 1) loop
    update recipe_images
    set    sort_order = i - 1
    where  id        = p_ordered_ids[i]
      and  recipe_id = p_recipe_id;
  end loop;
end;
$$;

grant execute on function reorder_recipe_images(uuid, uuid[]) to authenticated;
