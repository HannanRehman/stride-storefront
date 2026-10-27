-- Staged security hardening. Existing owners remain usable until each explicitly
-- verifies an authenticator and enables enforcement for their own membership.
begin;
alter table public.store_owners add column mfa_required boolean not null default false;
create table store_internal.security_config(id boolean primary key default true check(id),rpc_secret_hash text check(rpc_secret_hash ~ '^[a-f0-9]{64}$'));
insert into store_internal.security_config(id) values(true);
create table store_internal.rate_buckets(key text primary key check(length(key)<=160),attempts integer not null,expires_at timestamptz not null);
create index rate_buckets_expiry_idx on store_internal.rate_buckets(expires_at);
revoke all on store_internal.security_config,store_internal.rate_buckets from public,anon,authenticated;

create function store_internal.is_store_owner() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.store_owners where user_id=auth.uid() and (not mfa_required or coalesce(auth.jwt()->>'aal','')='aal2'));
$$;
revoke all on function store_internal.is_store_owner() from public,anon;
grant execute on function store_internal.is_store_owner() to authenticated;

create table public.security_events(
 id uuid primary key default gen_random_uuid(),actor_id uuid references auth.users(id) on delete set null,
 kind text not null check(length(kind) between 1 and 60),entity_id text not null default '' check(length(entity_id)<=160),
 created_at timestamptz not null default clock_timestamp()
);
create index security_events_created_idx on public.security_events(created_at desc,id);
create index security_events_actor_idx on public.security_events(actor_id);
alter table public.security_events enable row level security;
revoke all on public.security_events from public,anon,authenticated;
grant select on public.security_events to authenticated;
create policy "Verified owners read security history" on public.security_events for select to authenticated using((select store_internal.is_store_owner()));

create function store_internal.consume_security_limit(p_action text,p_identity text,p_ip text,p_secret text) returns boolean
language plpgsql security definer set search_path='' as $$
declare valid boolean;k text;hits integer;cap integer;allowed boolean:=true;prefix text;
begin
 if p_secret is null or length(p_secret) not between 32 and 200 then raise exception 'security:gateway';end if;
 select rpc_secret_hash is not null and rpc_secret_hash=encode(sha256(convert_to(coalesce(p_secret,''),'UTF8')),'hex') into valid from store_internal.security_config where id;
 if not coalesce(valid,false) then raise exception 'security:gateway';end if;
 if p_action is null or p_identity is null or p_ip is null or p_action not in('login','register','recovery','mfa','launch') or p_identity !~ '^[a-f0-9]{64}$' or p_ip !~ '^[a-f0-9]{64}$' then raise exception 'security:input';end if;
 -- Small bounded housekeeping; indexed expiry prevents an unbounded table scan.
 delete from store_internal.rate_buckets where key in(select key from store_internal.rate_buckets where expires_at<clock_timestamp() order by expires_at limit 200);
 foreach prefix in array array['ip','identity','pair'] loop
   cap:=case prefix when 'ip' then 60 when 'identity' then 16 else 8 end;
   k:=p_action||':'||prefix||':'||case prefix when 'ip' then p_ip when 'identity' then p_identity else encode(sha256(convert_to(p_ip||p_identity,'UTF8')),'hex') end;
   insert into store_internal.rate_buckets(key,attempts,expires_at) values(k,1,clock_timestamp()+interval '10 minutes')
    on conflict(key) do update set attempts=case when rate_buckets.expires_at<clock_timestamp() then 1 else least(rate_buckets.attempts+1,100000) end,
      expires_at=case when rate_buckets.expires_at<clock_timestamp() then clock_timestamp()+interval '10 minutes' else rate_buckets.expires_at end
    returning attempts into hits;
   if hits>cap then allowed:=false;end if;
 end loop;
 if not allowed then
   -- One entry per bucket/window, no IP/email/credential values in the log.
   if hits=9 then insert into public.security_events(kind,entity_id) values('request_limit',p_action);end if;
 end if;
 return allowed;
end;$$;
create function public.consume_security_limit(p_action text,p_identity text,p_ip text,p_secret text) returns boolean language sql security invoker set search_path='' as $$select store_internal.consume_security_limit($1,$2,$3,$4)$$;
revoke all on function store_internal.consume_security_limit(text,text,text,text),public.consume_security_limit(text,text,text,text) from public;
grant execute on function store_internal.consume_security_limit(text,text,text,text),public.consume_security_limit(text,text,text,text) to anon,authenticated;

create function store_internal.enable_owner_mfa() returns boolean language plpgsql security definer set search_path='' as $$
begin
 if coalesce(auth.jwt()->>'aal','')<>'aal2' or not exists(select 1 from public.store_owners where user_id=auth.uid()) then raise exception 'security:mfa';end if;
 update public.store_owners set mfa_required=true where user_id=auth.uid() and not mfa_required;
 if found then insert into public.security_events(actor_id,kind) values(auth.uid(),'owner_mfa_enabled');end if;
 return true;
end;$$;
create function public.enable_owner_mfa() returns boolean language sql security invoker set search_path='' as $$select store_internal.enable_owner_mfa()$$;
revoke all on function store_internal.enable_owner_mfa(),public.enable_owner_mfa() from public,anon;
grant execute on function store_internal.enable_owner_mfa(),public.enable_owner_mfa() to authenticated;

create policy "MFA owner draft reads" on public.catalog_products as restrictive for select to authenticated using(published or (select store_internal.is_store_owner()));
create policy "MFA owner product creation" on public.catalog_products as restrictive for insert to authenticated with check((select store_internal.is_store_owner()));
create policy "MFA owner product editing" on public.catalog_products as restrictive for update to authenticated using((select store_internal.is_store_owner())) with check((select store_internal.is_store_owner()));
create policy "MFA private order reads" on public.store_orders as restrictive for select to authenticated using(user_id=(select auth.uid()) or (select store_internal.is_store_owner()));
create policy "MFA private support reads" on public.support_requests as restrictive for select to authenticated using(user_id=(select auth.uid()) or (select store_internal.is_store_owner()));
create policy "MFA catalog uploads" on storage.objects as restrictive for insert to authenticated with check(bucket_id<>'catalog-media' or (select store_internal.is_store_owner()));
do $$ declare tab text;begin
 foreach tab in array array['site_content','site_content_revisions','launch_interest','email_jobs'] loop
  execute format('create policy "MFA owner private reads" on public.%I as restrictive for select to authenticated using((select store_internal.is_store_owner()))',tab);
 end loop;
end $$;

-- Existing permission checks remain, now with MFA for opted-in owners, including
-- direct RPC calls that bypass the website. Keep privileged routines private.
do $$ declare f record;definition text;begin
 for f in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='store_internal'
 and p.proname in('update_cod_order','set_checkout_settings','save_site_content','publish_site_content','restore_site_content','reply_support_request','set_support_status') loop
  definition:=pg_get_functiondef(f.oid);
  definition:=regexp_replace(definition,'exists\s*\(select 1 from public.store_owners where user_id\s*=\s*auth.uid\(\)\)','store_internal.is_store_owner()','g');
  execute definition;
 end loop;
end $$;

create function store_internal.audit_owner_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is not null and store_internal.is_store_owner() then
  insert into public.security_events(actor_id,kind,entity_id) values(auth.uid(),tg_table_name||'_'||lower(tg_op),coalesce(to_jsonb(new)->>'id',''));
 end if;
 return new;
end;$$;
revoke all on function store_internal.audit_owner_change() from public,anon,authenticated;
create trigger audit_catalog_change after insert or update on public.catalog_products for each row execute function store_internal.audit_owner_change();
create trigger audit_content_change after update on public.site_content for each row execute function store_internal.audit_owner_change();
create trigger audit_order_change after update on public.store_orders for each row execute function store_internal.audit_owner_change();
create trigger audit_checkout_change after update on public.checkout_settings for each row execute function store_internal.audit_owner_change();
notify pgrst,'reload schema';
commit;
