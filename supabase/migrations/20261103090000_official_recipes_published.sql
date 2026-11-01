-- S24c: a recipe that no longer passes the checks of pipeline/agribalyse_recipes.py (dish approached
-- by another recipe, annex 10) is unpublished, never deleted.
alter table public.official_recipes add column is_published boolean not null default true;
comment on column public.official_recipes.is_published is 'false = the dish no longer passes the checks of pipeline/agribalyse_recipes.py (see pipeline/reports/agribalyse_recipes_check.csv).';
