-- recipe_images: multiple photos per recipe (gallery), first by sort_order = cover.
-- RLS mirrors recipe_steps: read access follows parent recipe visibility, writes require ownership.

create table recipe_images (
  id           uuid        primary key default gen_random_uuid(),
  recipe_id    uuid        not null references recipes (id) on delete cascade,
  storage_path text        not null,   -- <user_id>/<recipe_id>/<filename>; kept for reliable deletes
  image_url    text        not null,   -- public URL (bucket is public)
  sort_order   integer     not null,   -- 0 = cover/thumbnail
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint recipe_images_unique_order unique (recipe_id, sort_order)
);

create trigger recipe_images_set_updated_at
  before update on recipe_images
  for each row execute function set_updated_at();

alter table recipe_images enable row level security;

-- Read access mirrors the visibility of the parent recipe (same EXISTS pattern as recipe_steps_read).
create policy "recipe_images_read"
  on recipe_images for select
  to anon, authenticated
  using (exists (
    select 1 from recipes r
    where r.id = recipe_images.recipe_id
      and (r.visibility = 'public' or r.author_user_id = auth.uid())
  ));

-- Writes require ownership of the parent recipe.
create policy "recipe_images_owner_write"
  on recipe_images for all
  to authenticated
  using (exists (
    select 1 from recipes r
    where r.id = recipe_images.recipe_id and r.author_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from recipes r
    where r.id = recipe_images.recipe_id and r.author_user_id = auth.uid()
  ));
