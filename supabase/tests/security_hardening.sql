begin;
insert into auth.users(id) values('5ec00000-0000-4000-8000-000000000001'),('5ec00000-0000-4000-8000-000000000002');
insert into public.store_owners(user_id) values('5ec00000-0000-4000-8000-000000000001');
update store_internal.security_config set rpc_secret_hash=encode(sha256(convert_to('fixture-security-secret-not-for-production','UTF8')),'hex') where id;
set local role anon;
do $$ declare i integer;begin
 begin perform public.consume_security_limit('login',repeat('a',64),repeat('b',64),'wrong');raise exception 'Unauthenticated limiter gateway bypass';exception when raise_exception then if sqlerrm<>'security:gateway' then raise;end if;end;
 begin perform 1 from store_internal.rate_buckets;raise exception 'Private rate data exposed';exception when insufficient_privilege then null;end;
 for i in 1..8 loop if not public.consume_security_limit('login',repeat('a',64),repeat('b',64),'fixture-security-secret-not-for-production') then raise exception 'Valid request denied';end if;end loop;
 if public.consume_security_limit('login',repeat('a',64),repeat('b',64),'fixture-security-secret-not-for-production') then raise exception 'Shared pair limit bypassed';end if;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','5ec00000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"aal":"aal1"}',true);
do $$ begin
 if not store_internal.is_store_owner() then raise exception 'Staged owners locked out';end if;
 begin perform public.enable_owner_mfa();raise exception 'MFA enabled without aal2';exception when raise_exception then if sqlerrm<>'security:mfa' then raise;end if;end;
end $$;
select set_config('request.jwt.claims','{"aal":"aal2"}',true);
select public.enable_owner_mfa();
select set_config('request.jwt.claims','{"aal":"aal1"}',true);
do $$ begin
 if store_internal.is_store_owner() then raise exception 'Password-only owner bypass';end if;
 if not exists(select 1 from public.store_owners where user_id=auth.uid() and mfa_required) then raise exception 'Owner cannot read own MFA state';end if;
 if exists(select 1 from public.security_events) or exists(select 1 from public.site_content) then raise exception 'Owner private data visible without MFA';end if;
 begin perform public.save_site_content('{}',0);raise exception 'Direct CMS RPC bypassed MFA';exception when raise_exception then if sqlerrm<>'checkout:owner_only' then raise;end if;end;
 begin perform public.set_checkout_settings(false,25000,now());raise exception 'Direct settings RPC bypassed MFA';exception when raise_exception then if sqlerrm<>'checkout:owner_only' then raise;end if;end;
 begin perform public.update_cod_order(gen_random_uuid(),now(),'confirmed');raise exception 'Direct order RPC bypassed MFA';exception when raise_exception then if sqlerrm<>'checkout:owner_only' then raise;end if;end;
 begin insert into storage.objects(bucket_id,name) values('catalog-media',auth.uid()::text||'/mfa-test.webp');raise exception 'Photo insert bypassed MFA';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"aal":"aal2"}',true);
do $$ begin
 if not store_internal.is_store_owner() then raise exception 'Verified owner denied';end if;
 if not exists(select 1 from public.security_events where kind='owner_mfa_enabled' and actor_id=auth.uid()) then raise exception 'MFA audit history missing';end if;
 begin delete from public.security_events;raise exception 'Owner deleted security evidence';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','5ec00000-0000-4000-8000-000000000002',true);
do $$ begin
 if store_internal.is_store_owner() then raise exception 'Customer became owner';end if;
 if exists(select 1 from public.security_events) then raise exception 'Customer sees owner security evidence';end if;
 begin perform public.enable_owner_mfa();raise exception 'Customer changed owner requirements';exception when raise_exception then if sqlerrm<>'security:mfa' then raise;end if;end;
end $$;
reset role;
do $$ begin
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef) then raise exception 'Exposed SECURITY DEFINER';end if;
end $$;
rollback;
