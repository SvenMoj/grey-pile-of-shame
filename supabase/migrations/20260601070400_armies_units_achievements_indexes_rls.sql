-- Indexes
create index armies_user_idx                on armies             (user_id);
create index units_user_idx                 on units              (user_id);
create index units_army_idx                 on units              (army_id);
create index miniature_items_unit_idx       on miniature_items    (unit_id);
create index user_achievements_user_idx     on user_achievements  (user_id);

-- RLS (owner-all pattern, mirrors miniature_items_owner_all)
alter table armies            enable row level security;
alter table units             enable row level security;
alter table user_achievements enable row level security;

create policy "armies_owner_all"
  on armies for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "units_owner_all"
  on units for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_achievements_owner_all"
  on user_achievements for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
