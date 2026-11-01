-- EAT-Lancet 2025: Summary Report of EAT Forum accepted as provisional source (decision of Matt,
-- 2026-11-01). Figure 01, p. 11: dietary targets in grams per day (ranges), ~2,400 kcal/day.
insert into public.sources (id, name, publisher, version, url, license, commercial_use, share_alike, accessed_on, notes) values
('eat-lancet-summary-2025', 'EAT-Lancet Summary Report 2025 — The EAT-Lancet Commission on Healthy, Sustainable, and Just Food Systems',
 'EAT Forum', 'Summary Report 2025 (fichier EL_Summary-Report_2025_v1.pdf)',
 'https://eatforum.org/wp-content/uploads/2026/04/EL_Summary-Report_2025_v1.pdf',
 'Non indiquée dans le document', null, false, '2026-11-01',
 'Source provisoire, à recouper avec l''article du Lancet (inaccessible, HTTP 403). Figure 01, p. 11.')
on conflict (id) do nothing;
