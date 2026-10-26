-- Keep privileged implementations outside the exposed Data API schema.
-- Public SECURITY INVOKER entry points retain the exact API and role grants.
begin;
create schema if not exists store_internal;
revoke all on schema store_internal from public;
grant usage on schema store_internal to anon,authenticated,service_role;
do $$
declare f record;identity_args text;all_args text;result_type text;parameters text;body_sql text;roles text;
begin
 for f in select p.oid,p.proname,p.pronargs,p.provolatile
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prosecdef and p.proname in(
   'read_site_content','quote_cod_order','place_cod_order','update_cod_order','set_checkout_settings',
   'save_site_content','publish_site_content','restore_site_content','open_support_request',
   'reply_support_request','set_support_status','register_launch_interest','confirm_launch_interest',
   'unsubscribe_launch_interest','claim_email_jobs','finish_email_job'
  ) loop
  identity_args:=pg_get_function_identity_arguments(f.oid);
  all_args:=pg_get_function_arguments(f.oid);
  result_type:=case when f.proname='claim_email_jobs' then 'SETOF public.email_jobs' else pg_get_function_result(f.oid) end;
  select coalesce(string_agg('$'||i,',' order by i),'') into parameters from generate_series(1,f.pronargs) i;
  roles:=case when f.proname in('claim_email_jobs','finish_email_job') then 'service_role'
    when f.proname in('read_site_content','register_launch_interest','confirm_launch_interest','unsubscribe_launch_interest') then 'anon,authenticated'
    else 'authenticated' end;
  execute format('alter function public.%I(%s) set schema store_internal',f.proname,identity_args);
  execute format('revoke all on function store_internal.%I(%s) from public,anon,authenticated,service_role',f.proname,identity_args);
  execute format('grant execute on function store_internal.%I(%s) to %s',f.proname,identity_args,roles);
  body_sql:=case when f.proname='claim_email_jobs' then format('select * from store_internal.%I(%s)',f.proname,parameters)
    else format('select store_internal.%I(%s)',f.proname,parameters) end;
  execute format('create function public.%I(%s) returns %s language sql security invoker %s set search_path = '''' as %L',
    f.proname,all_args,result_type,case when f.provolatile='s' then 'stable' else 'volatile' end,body_sql);
  execute format('revoke all on function public.%I(%s) from public,anon,authenticated,service_role',f.proname,identity_args);
  execute format('grant execute on function public.%I(%s) to %s',f.proname,identity_args,roles);
 end loop;
end $$;
-- Triggers retain their OID bindings when their functions move schemas.
alter function public.queue_order_email() set schema store_internal;
alter function public.queue_support_email() set schema store_internal;
notify pgrst,'reload schema';
commit;
