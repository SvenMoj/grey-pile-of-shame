-- Add hidden_brands preference to user profiles.
-- Stores a list of brand names the user wants suppressed in paint suggestions.
-- Reuses the existing profiles_owner_all RLS policy (id = auth.uid()).

alter table profiles
  add column if not exists hidden_brands text[] not null default '{}';
