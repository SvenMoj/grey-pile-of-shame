-- Storage bucket for recipe photos.
-- Path convention: <user_id>/<recipe_id>/<filename>
-- Public bucket: URLs are stable and do not need signed-URL rotation.

insert into storage.buckets (id, name, public)
  values ('recipe-images', 'recipe-images', true);

create policy "recipe_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'recipe-images');

create policy "recipe_images_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "recipe_images_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "recipe_images_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
