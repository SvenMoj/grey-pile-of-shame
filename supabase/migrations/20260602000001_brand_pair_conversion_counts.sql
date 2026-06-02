-- Returns the number of conversions between each ordered brand pair.
-- Used by the /convert pages to build generateStaticParams and show counts.
create or replace function brand_pair_conversion_counts()
returns table(brand_a text, brand_b text, n bigint)
language sql stable as $$
  select pa.brand, pb.brand, count(*)
  from conversions c
  join paints pa on pa.id = c.paint_a_id
  join paints pb on pb.id = c.paint_b_id
  where pa.brand <> pb.brand
  group by pa.brand, pb.brand;
$$;
