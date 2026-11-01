-- S24c: French label of each official recipe input (name of the ingredient in the AGRIBALYSE 3.2
-- detail per ingredient, reviewed in pipeline/agribalyse_recipe_ingredients.csv), shown on the site.
alter table public.official_recipes add column ingredient_fr text;
comment on column public.official_recipes.ingredient_fr is 'Ingredient name in the AGRIBALYSE 3.2 detail per ingredient (reviewed match); null for added water.';
