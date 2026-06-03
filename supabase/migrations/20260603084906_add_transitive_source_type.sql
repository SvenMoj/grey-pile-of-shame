-- Extend the source_type CHECK constraint on conversions to allow 'transitive'.
-- Transitive conversions are derived at build time by bridging two official
-- conversions through a shared intermediate paint (e.g. two brands that both
-- map to the same Citadel colour are linked as a transitive pair).

alter table conversions drop constraint conversions_source_type_check;
alter table conversions add constraint conversions_source_type_check
  check (source_type in ('official_chart', 'community', 'hex_derived', 'transitive'));
