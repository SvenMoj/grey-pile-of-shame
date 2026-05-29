-- RLS policy intent (extends the catalog philosophy from ...000006):
--   user_paints / miniature_items / recipe_applications: owner-only (auth.uid() = user_id).
--   recipes: public rows readable by anyone; private rows + all writes owner-only.
--   recipe_steps: visibility / ownership inherited from the parent recipe.
--   Service-role admin client continues to bypass RLS for all of these.

alter table user_paints          enable row level security;
alter table miniature_items      enable row level security;
alter table recipes              enable row level security;
alter table recipe_steps         enable row level security;
alter table recipe_applications  enable row level security;

-- user_paints: authenticated owner can do everything; nobody else sees anything
create policy "user_paints_owner_all"
  on user_paints for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- miniature_items: same owner-isolation pattern
create policy "miniature_items_owner_all"
  on miniature_items for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- recipe_applications: same owner-isolation pattern
create policy "recipe_applications_owner_all"
  on recipe_applications for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- recipes: public rows are readable by anyone (discovery funnel);
-- private rows and all writes are owner-only.
-- Note: the for-select and for-all policies are OR-combined by Postgres for SELECT,
-- so owners always see their own private rows regardless of visibility.
create policy "recipes_public_or_owner_read"
  on recipes for select
  to anon, authenticated
  using (visibility = 'public' or auth.uid() = author_user_id);

create policy "recipes_owner_write"
  on recipes for all
  to authenticated
  using (auth.uid() = author_user_id)
  with check (auth.uid() = author_user_id);

-- recipe_steps: read access mirrors the visibility of the parent recipe;
-- writes require ownership of the parent recipe.
create policy "recipe_steps_read"
  on recipe_steps for select
  to anon, authenticated
  using (exists (
    select 1 from recipes r
    where r.id = recipe_steps.recipe_id
      and (r.visibility = 'public' or r.author_user_id = auth.uid())
  ));

create policy "recipe_steps_owner_write"
  on recipe_steps for all
  to authenticated
  using (exists (
    select 1 from recipes r
    where r.id = recipe_steps.recipe_id and r.author_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from recipes r
    where r.id = recipe_steps.recipe_id and r.author_user_id = auth.uid()
  ));
