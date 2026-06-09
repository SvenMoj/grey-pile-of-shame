-- Add instagram_handle to profiles.
-- Used by the Share Studio to embed an @handle on generated images,
-- and will seed the future public profile page.
-- Nullable; no uniqueness constraint yet (single-user scope for now).

alter table profiles
  add column if not exists instagram_handle text;
