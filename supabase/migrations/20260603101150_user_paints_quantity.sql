alter table user_paints
  add column quantity integer not null default 1
  constraint user_paints_quantity_check check (quantity >= 1);

create unique index user_paints_user_catalog_uniq
  on user_paints (user_id, catalog_paint_id)
  where catalog_paint_id is not null;
