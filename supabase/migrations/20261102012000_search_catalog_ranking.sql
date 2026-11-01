-- Better ranking for search_catalog: names containing every word first, then typo-tolerant
-- trigram similarity; "œ" / "æ" folded to "oe" / "ae" (unaccent keeps them).
create or replace function public.search_catalog(q text, max_results int default 30)
returns table (kind text, ref text, name_fr text, is_animal boolean, has_alternatives boolean, score real)
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
  with pairs as (
    select distinct on (a.slug)
      'paire'::text as kind, a.slug as ref, a.name_fr, true as is_animal, true as has_alternatives,
      (case when not exists (select 1 from unnest(words) w where position(w in replace(a.name_norm, 'œ', 'oe') || ' ' || replace(v.name_norm, 'œ', 'oe')) = 0)
            then 2.0 else greatest(word_similarity(qq, replace(a.name_norm, 'œ', 'oe')), word_similarity(qq, replace(v.name_norm, 'œ', 'oe'))) end)::real as score
    from public.dish_pairs p
    join public.dishes a on a.id = p.animal_dish_id and a.is_published
    join public.dishes v on v.id = p.vegan_dish_id and v.is_published
    where p.is_published
    order by a.slug, score desc
  ),
  items as (
    select 'aliment'::text as kind, f.code as ref, f.name_fr, f.is_animal,
           exists (select 1 from public.food_alternatives fa where fa.animal_code = f.code) as has_alternatives,
           (case when not exists (select 1 from unnest(words) w where position(w in replace(f.name_norm, 'œ', 'oe')) = 0)
                 then 2.0 + (case when replace(f.name_norm, 'œ', 'oe') like words[1] || '%' then 0.5 else 0 end)
                 else word_similarity(qq, replace(f.name_norm, 'œ', 'oe')) end)::real as score
    from public.foods f
  )
  (select * from pairs where score >= 0.6 order by score desc limit max_results)
  union all
  (select * from items where score >= 0.4 order by score desc, length(name_fr) limit max_results);
end;
$$;
