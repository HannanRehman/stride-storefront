-- Owner authorization and catalog invariants. Entire fixture rolls back.
begin;
insert into auth.users(id) values ('b0a00000-0000-4000-8000-000000000001'), ('b0a00000-0000-4000-8000-000000000002');
insert into public.store_owners(user_id) values ('b0a00000-0000-4000-8000-000000000001');
insert into public.catalog_products (id,slug,name,subtitle,audience,category,sport,collection,price_minor,currency,image,color,color_hex,sizes,description,featured_rank,published_at,published)
values ('owner-test','owner-test','Owner draft','Hoodie','unisex','clothing','Lifestyle','everyday',700000,'PKR','/images/tee.webp','Navy','#17283b','[{"code":"M","stock":3}]','Test product',0,current_date,false);
set local role anon;
do $$ begin
  if exists(select 1 from public.catalog_products where id='owner-test') then raise exception 'Anonymous draft exposure'; end if;
  begin update public.catalog_products set name='Tampered' where id='owner-test'; raise exception 'Anonymous write accepted'; exception when insufficient_privilege then null; end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0a00000-0000-4000-8000-000000000002', true);
do $$ begin
  if exists(select 1 from public.store_owners) then raise exception 'Customer can read owner membership'; end if;
  if exists(select 1 from public.catalog_products where id='owner-test') then raise exception 'Customer can read draft'; end if;
  update public.catalog_products set name='Tampered' where id='owner-test';
  if found then raise exception 'Customer write accepted'; end if;
  begin insert into public.store_owners(user_id) values ('b0a00000-0000-4000-8000-000000000002'); raise exception 'Customer promoted themselves'; exception when insufficient_privilege then null; end;
  begin insert into storage.objects(bucket_id,name) values ('catalog-media','b0a00000-0000-4000-8000-000000000002/test.webp'); raise exception 'Customer upload accepted'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', 'b0a00000-0000-4000-8000-000000000001', true);
do $$ declare version timestamptz; changed integer; begin
  if not exists(select 1 from public.catalog_products where id='owner-test') then raise exception 'Owner cannot read draft'; end if;
  select updated_at into version from public.catalog_products where id='owner-test';
  update public.catalog_products set name='Updated by owner' where id='owner-test' and updated_at=version;
  if not found then raise exception 'Owner update failed'; end if;
  update public.catalog_products set name='Stale edit' where id='owner-test' and updated_at=version;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Stale version accepted'; end if;
  begin update public.catalog_products set sizes='[{"code":"M","stock":-1}]' where id='owner-test'; raise exception 'Negative stock accepted'; exception when check_violation then null; end;
  begin update public.catalog_products set sizes='[{"code":"M","stock":1},{"code":"m","stock":2}]' where id='owner-test'; raise exception 'Duplicate sizes accepted'; exception when check_violation then null; end;
  begin update public.catalog_products set currency='INVALID' where id='owner-test'; raise exception 'Invalid currency accepted'; exception when check_violation then null; end;
  update public.catalog_products set published=true where id='owner-test';
  update public.catalog_products set published=false,ever_published=false where id='owner-test';
  if not (select ever_published from public.catalog_products where id='owner-test') then raise exception 'Publication history erased'; end if;
  begin update public.catalog_products set slug='changed-url' where id='owner-test'; raise exception 'Published slug changed'; exception when raise_exception then if sqlerrm <> 'A published slug cannot change' then raise; end if; end;
  begin delete from public.catalog_products where id='owner-test'; raise exception 'Hard delete accepted'; exception when insufficient_privilege then null; end;
  insert into storage.objects(bucket_id,name) values ('catalog-media','b0a00000-0000-4000-8000-000000000001/test.webp');
  begin insert into storage.objects(bucket_id,name) values ('catalog-media','someone-else/test.webp'); raise exception 'Foreign upload path accepted'; exception when insufficient_privilege then null; end;
  begin insert into storage.objects(bucket_id,name) values ('other-bucket','b0a00000-0000-4000-8000-000000000001/test.webp'); raise exception 'Foreign bucket accepted'; exception when insufficient_privilege then null; end;
end $$;
rollback;
