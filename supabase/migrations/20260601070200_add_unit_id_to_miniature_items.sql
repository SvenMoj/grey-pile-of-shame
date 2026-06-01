-- Add optional unit grouping to individual models.
-- Nullable: null = loose model (no unit). on delete set null = deleting a unit
-- releases its models back to "loose" rather than destroying them.
-- unit_size remains an independent cosmetic squad-count badge; converting
-- unit_size>1 items into proper units is an explicit non-goal.
alter table miniature_items
  add column unit_id uuid references units (id) on delete set null;
