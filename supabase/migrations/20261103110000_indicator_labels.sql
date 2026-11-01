-- S25 (step 4, LCA review): the water indicator is a deprivation potential weighted by scarcity
-- (AWARE, EF 3.1), not a volume of water used (Zampori & Pant, JRC 2019, Table 2 and p. 22).
update public.indicators set name_fr = 'Eau : risque de privation (AWARE)', unit = 'm³ éq. monde' where id = 'water_scarcity_m3';
