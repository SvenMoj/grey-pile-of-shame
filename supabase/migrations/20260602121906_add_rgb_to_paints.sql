-- Add R/G/B integer columns to paints.
-- Values come from the markdown source files in data/paints/.
-- Nullable so existing rows (seeded before this migration) stay valid.
-- The build-catalog-from-markdown script populates these for all paints.

alter table paints
  add column r smallint check (r between 0 and 255),
  add column g smallint check (g between 0 and 255),
  add column b smallint check (b between 0 and 255);
