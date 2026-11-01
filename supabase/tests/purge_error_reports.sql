-- Test: purge_old_error_reports() deletes reports older than 12 months, keeps recent ones,
-- and the daily pg_cron job exists. Fixtures rolled back.
begin;
insert into public.error_reports (page, message, created_at) values
  ('/test-purge', 'ancien', now() - interval '13 months'),
  ('/test-purge', 'récent', now() - interval '11 months');
select public.purge_old_error_reports();
select case
  when (select count(*) from public.error_reports where page = '/test-purge' and message = 'ancien') = 0
   and (select count(*) from public.error_reports where page = '/test-purge' and message = 'récent') = 1
   and (select count(*) from cron.job where jobname = 'purge-error-reports' and active) = 1
  then 'PASS' else 'FAIL' end as purge_error_reports_test;
rollback;
