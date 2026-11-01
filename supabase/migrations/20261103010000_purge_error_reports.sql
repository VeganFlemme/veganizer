-- =====================================================================
-- Error reports kept 12 months (decision of Matt, 2026-11-01; /confidentialite).
-- pg_cron (available on the Supabase Free plan) runs the purge every day at 03:15 UTC, so no
-- report is kept more than 12 months and 1 day. Only error_reports rows are deleted.
-- =====================================================================
create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.purge_old_error_reports()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.error_reports where created_at < now() - interval '12 months';
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.purge_old_error_reports() from public, anon, authenticated;

select cron.schedule('purge-error-reports', '15 3 * * *', 'select public.purge_old_error_reports()');
