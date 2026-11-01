-- Fix of 20261102010000: output column names clash with table columns in PL/pgSQL.
create or replace function public.search_catalog(q text, max_results int default 30)
returns table (kind text, ref text, name_fr text, is_animal boolean, has_alternatives boolean, score real)
language plpgsql stable security invoker
set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  qq text := lower(public.f_unaccent(coalesce(trim(q), '')));
  s record;
begin
  if length(qq) < 2 then
    return;
  end if;
  for s in select term, expansion from public.search_synonyms loop
    qq := regexp_replace(qq, '\m' || s.term || '\M', s.expansion, 'g');
  end loop;
  return query
  with pairs as (
    select distinct on (a.slug)
      'paire'::text as kind, a.slug as ref, a.name_fr, true as is_animal, true as has_alternatives,
      greatest(word_similarity(qq, a.name_norm), word_similarity(qq, v.name_norm))::real as score
    from public.dish_pairs p
    join public.dishes a on a.id = p.animal_dish_id and a.is_published
    join public.dishes v on v.id = p.vegan_dish_id and v.is_published
    where p.is_published
      and (a.name_norm like '%' || qq || '%' or v.name_norm like '%' || qq || '%'
           or word_similarity(qq, a.name_norm) > 0.45 or word_similarity(qq, v.name_norm) > 0.45)
    order by a.slug, score desc
  ),
  items as (
    select 'aliment'::text as kind, f.code as ref, f.name_fr, f.is_animal,
           exists (select 1 from public.food_alternatives fa where fa.animal_code = f.code) as has_alternatives,
           (case when f.name_norm like qq || '%' then 1.0 else word_similarity(qq, f.name_norm) end)::real as score
    from public.foods f
    where f.name_norm like '%' || qq || '%' or qq <% f.name_norm
  )
  (select * from pairs order by score desc limit max_results)
  union all
  (select * from items order by score desc, length(name_fr) limit max_results);
end;
$$;

