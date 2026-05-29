create index user_paints_user_idx              on user_paints          (user_id);
create index user_paints_catalog_idx           on user_paints          (catalog_paint_id);
create index miniature_items_user_idx           on miniature_items      (user_id);
create index recipes_author_idx                 on recipes              (author_user_id);
create index recipe_steps_recipe_idx            on recipe_steps         (recipe_id);
create index recipe_applications_user_idx        on recipe_applications  (user_id);
create index recipe_applications_mini_idx        on recipe_applications  (miniature_item_id);
create index recipe_applications_recipe_idx      on recipe_applications  (recipe_id);
