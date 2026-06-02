-- Add image_url and visibility columns to miniature_items,
-- plus a Supabase Storage bucket for model photos.

-- ─── miniature_items columns ───────────────────────────────────────────────

alter table miniature_items
  add column image_url  text,
  add column visibility text not null default 'private'
    check (visibility in ('private', 'public'));

-- Public rows are readable by anyone (anon or authenticated).
-- The existing miniature_items_owner_all policy (FOR ALL, owner) already
-- covers SELECT for the owner, so Postgres OR-combines the two SELECT
-- policies — owners always see their own rows regardless of visibility.
create policy "miniature_items_public_read"
  on miniature_items for select
  to anon, authenticated
  using (visibility = 'public' or auth.uid() = user_id);

-- ─── Storage bucket: model-images ──────────────────────────────────────────

insert into storage.buckets (id, name, public)
  values ('model-images', 'model-images', true);

-- Path convention: <user_id>/<item_id>/<filename>
-- Public bucket means objects can be read without auth, but we add an
-- explicit policy anyway so it is self-documenting.

create policy "model_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'model-images');

create policy "model_images_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'model-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "model_images_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'model-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "model_images_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'model-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
