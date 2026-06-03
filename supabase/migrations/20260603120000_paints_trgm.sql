-- Enable the pg_trgm extension for fuzzy/trigram text search on the paints catalog.
-- Adds GIN trigram indexes on the columns used by the search_paints() RPC.
create extension if not exists pg_trgm;

create index if not exists paints_name_trgm_idx  on paints using gin (name  gin_trgm_ops);
create index if not exists paints_brand_trgm_idx on paints using gin (brand gin_trgm_ops);
