-- =====================================================================
-- S16 — /recette: ingredient autocompletion (pure foods only) and reviewed substitutions
-- =====================================================================

-- Ingredient-by-ingredient substitutions for the "Version végétale" button, imported from the
-- reviewed pipeline/substitutions.csv (first matching rule by priority wins).
create table public.ingredient_substitutions (
  priority       int primary key,
  match_type     text not null check (match_type in ('iarc', 'name_regex', 'subgroup', 'category')),
  match_value    text not null,
  to_code        text not null references public.foods(code),
  ratio          numeric not null check (ratio > 0),
  justification  text not null
);
alter table public.ingredient_substitutions enable row level security;
create policy "lecture publique" on public.ingredient_substitutions for select using (true);
grant select on public.ingredient_substitutions to anon, authenticated;
grant all on public.ingredient_substitutions to service_role;

-- Autocompletion: same ranking as search_catalog, restricted to foods usable as recipe
-- ingredients (CLAUDE.md rule 9): no mixed animal food (is_animal without animal_category),
-- no composed dish (group "entrées et plats composés").
create or replace function public.search_ingredients(q text, max_results int default 15)
returns table (code text, name_fr text, is_animal boolean, animal_category text, food_subgroup text, score real)
language plpgsql stable security invoker
set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  qq text := replace(replace(lower(public.f_unaccent(coalesce(trim(q), ''))), 'œ', 'oe'), 'æ', 'ae');
  words text[];
  s record;
begin
  if length(qq) < 2 then
    return;
  end if;
  for s in select term, expansion from public.search_synonyms loop
    qq := regexp_replace(qq, '\m' || s.term || '\M', s.expansion, 'g');
  end loop;
  words := array(select w from unnest(regexp_split_to_array(qq, '[^a-z0-9-]+')) w where length(w) >= 2);
  if array_length(words, 1) is null then
    return;
  end if;
  return query
  select f.code, f.name_fr, f.is_animal, f.animal_category, f.food_subgroup,
         (case when not exists (select 1 from unnest(words) w where position(w in replace(f.name_norm, 'œ', 'oe')) = 0)
               then 2.0 + (case when replace(f.name_norm, 'œ', 'oe') like words[1] || '%' then 0.5 else 0 end)
               else word_similarity(qq, replace(f.name_norm, 'œ', 'oe')) end)::real as score
  from public.foods f
  where not (f.is_animal and f.animal_category is null)
    and coalesce(f.food_group, '') <> 'entrées et plats composés'
    and (not exists (select 1 from unnest(words) w where position(w in replace(f.name_norm, 'œ', 'oe')) = 0)
         or word_similarity(qq, replace(f.name_norm, 'œ', 'oe')) >= 0.4)
  order by score desc, length(f.name_fr)
  limit max_results;
end;
$$;

grant execute on function public.search_ingredients(text, int) to anon, authenticated;
