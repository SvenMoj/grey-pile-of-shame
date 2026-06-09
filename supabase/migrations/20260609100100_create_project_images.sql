-- project_images: multiple photos per project (gallery), first by sort_order = cover/hero.
-- RLS mirrors recipe_images: read access follows parent project visibility,
-- writes require ownership.

create table project_images (
  id           uuid        primary key default gen_random_uuid(),
  project_id   uuid        not null references projects (id) on delete cascade,
  storage_path text        not null,   -- <user_id>/<project_id>/<filename>; kept for reliable deletes
  image_url    text        not null,   -- public URL (bucket is public)
  sort_order   integer     not null,   -- 0 = cover/hero
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint project_images_unique_order unique (project_id, sort_order)
);

create trigger project_images_set_updated_at
  before update on project_images
  for each row execute function set_updated_at();

alter table project_images enable row level security;

-- Read access mirrors the visibility of the parent project.
create policy "project_images_read"
  on project_images for select
  to anon, authenticated
  using (exists (
    select 1 from projects p
    where p.id = project_images.project_id
      and (p.status = 'published' or p.author_user_id = auth.uid())
  ));

-- Writes require ownership of the parent project.
create policy "project_images_owner_write"
  on project_images for all
  to authenticated
  using (exists (
    select 1 from projects p
    where p.id = project_images.project_id and p.author_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from projects p
    where p.id = project_images.project_id and p.author_user_id = auth.uid()
  ));

-- Storage bucket for project photos.
-- Path convention: <user_id>/<project_id>/<filename>
-- Public bucket: URLs are stable and do not need signed-URL rotation.

insert into storage.buckets (id, name, public)
  values ('project-images', 'project-images', true);

create policy "project_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'project-images');

create policy "project_images_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "project_images_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "project_images_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
