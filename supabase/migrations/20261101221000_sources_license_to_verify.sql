-- Correction of 20261101220000: the reuse conditions of these documents were not read
-- on their pages. null = to verify before any commercial use (CLAUDE.md rule 7).
update public.sources
set commercial_use = null,
    license = 'À vérifier (document public, conditions de réutilisation non lues)'
where id in ('dir-1999-74-ce', 'label-rouge-la-07-85', 'label-rouge-la-13-97', 'agri-bien-etre-porcs');
