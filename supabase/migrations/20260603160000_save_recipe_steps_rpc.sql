-- save_recipe_steps: atomically replace all steps for a recipe.
-- Deletes the existing steps for p_recipe_id, then bulk-inserts p_steps in the
-- provided order (step_order = array index). Runs in a single transaction so a
-- mid-write failure cannot leave the recipe half-updated.
--
-- security invoker: the RLS policies on recipe_steps apply, so only the recipe
-- owner can successfully call this function.
--
-- p_steps is a jsonb array where each element has the shape:
--   { role, target_paint_id, target_hex, technique_note, area_note }
-- (id is not persisted here — every save generates fresh UUIDs)

create or replace function save_recipe_steps(
  p_recipe_id uuid,
  p_steps     jsonb
)
returns void
language plpgsql
security invoker
as $$
declare
  v_step   jsonb;
  v_order  integer := 0;
begin
  -- Remove all existing steps (RLS WITH CHECK fires on each row; owner-only).
  delete from recipe_steps where recipe_id = p_recipe_id;

  -- Insert the new steps in the provided order.
  for v_step in select * from jsonb_array_elements(p_steps)
  loop
    insert into recipe_steps (
      recipe_id,
      step_order,
      role,
      target_paint_id,
      target_hex,
      technique_note,
      area_note
    ) values (
      p_recipe_id,
      v_order,
      (v_step->>'role'),
      nullif(v_step->>'target_paint_id', ''),
      nullif(v_step->>'target_hex', ''),
      nullif(v_step->>'technique_note', ''),
      nullif(v_step->>'area_note', '')
    );
    v_order := v_order + 1;
  end loop;
end;
$$;

grant execute on function save_recipe_steps(uuid, jsonb) to authenticated;
