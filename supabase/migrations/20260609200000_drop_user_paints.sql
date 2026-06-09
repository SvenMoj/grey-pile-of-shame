-- Remove the paint inventory feature (user_paints table).
-- Paints are now only relevant as a reference catalog for recipe authoring;
-- per-user inventory tracking is no longer part of the product.
-- cascade drops the RLS policy, trigger, and all indexes automatically.

drop table if exists user_paints cascade;
