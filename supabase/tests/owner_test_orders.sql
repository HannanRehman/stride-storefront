-- Disposable regression assertions. No users, orders or stock changes survive.
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('7e570000-0000-4000-8000-000000000001','owner-test@example.invalid',now()),
 ('7e570000-0000-4000-8000-000000000002','customer-test@example.invalid',now());
insert into public.store_owners(user_id) values ('7e570000-0000-4000-8000-000000000001');
insert into public.catalog_products(id,slug,name,subtitle,audience,category,sport,collection,price_minor,currency,image,color,color_hex,sizes,description,featured_rank,published_at,published,orderable,test_only)
values ('owner-test-fixture','owner-test-fixture','Test set','Test','unisex','clothing','Lifestyle','everyday',700000,'PKR','/images/tee.webp','Navy','#111111','[{"code":"M","stock":5}]','Test',0,current_date,true,true,true),
 ('real-test-fixture','real-test-fixture','Normal product','Normal','unisex','clothing','Lifestyle','everyday',700000,'PKR','/images/tee.webp','Navy','#111111','[{"code":"M","stock":5}]','Test',0,current_date,true,true,false);
update public.checkout_settings set enabled=false,shipping_minor=25000;
set local role authenticated;
select set_config('request.jwt.claim.sub','7e570000-0000-4000-8000-000000000002',true);
do $$ begin
 if public.quote_cod_order('[{"productId":"owner-test-fixture","size":"M","quantity":1}]')->>'is_test' <> 'true' then raise exception 'Signed-in customer cannot quote a test order';end if;
 begin perform public.quote_cod_order('[{"productId":"real-test-fixture","size":"M","quantity":1}]');raise exception 'Customer bypassed real checkout closure';
 exception when raise_exception then if sqlerrm <> 'checkout:closed' then raise;end if;end;
end $$;
select set_config('request.jwt.claim.sub','7e570000-0000-4000-8000-000000000001',true);
do $$ declare q jsonb;oid uuid;o public.store_orders%rowtype;
 items jsonb := '[{"productId":"owner-test-fixture","size":"M","quantity":1}]';
 addr jsonb := '{"recipient":"Test Customer","phone":"03001234567","line1":"Test Street","city":"Lahore","province":"Punjab","country":"PK"}';
begin
 q:=public.quote_cod_order(items);
 if q->>'is_test'<>'true' or (q->>'total_minor')::integer<>725000 then raise exception 'Test quote not marked/priced correctly';end if;
 begin perform public.quote_cod_order('[{"productId":"real-test-fixture","size":"M","quantity":1}]');raise exception 'Owner ordered real stock while closed';
 exception when raise_exception then if sqlerrm <> 'checkout:closed' then raise;end if;end;
 begin perform public.place_cod_order(gen_random_uuid(),items,addr,q-'is_test');raise exception 'Client stripped test marker';
 exception when raise_exception then if sqlerrm <> 'checkout:price_changed' then raise;end if;end;
 oid:=public.place_cod_order('7e570000-0000-4000-8000-000000000010',items,addr,q);
 if public.place_cod_order('7e570000-0000-4000-8000-000000000010',items,addr,q)<>oid then raise exception 'Retry duplicated test order';end if;
 select * into o from public.store_orders where id=oid;
 if not o.is_test then raise exception 'Test order flag missing';end if;
 if (select (sizes->0->>'stock')::integer from public.catalog_products where id='owner-test-fixture')<>4 then raise exception 'Test inventory not reserved exactly once';end if;
 perform public.update_cod_order(oid,o.updated_at,'confirmed');
 select * into o from public.store_orders where id=oid;
 perform public.update_cod_order(oid,o.updated_at,'cancelled');
 if (select (sizes->0->>'stock')::integer from public.catalog_products where id='owner-test-fixture')<>5 then raise exception 'Test cancellation failed to restock';end if;
 oid:=public.place_cod_order(gen_random_uuid(),items,addr,q);
 select * into o from public.store_orders where id=oid;
 perform public.update_cod_order(oid,o.updated_at,'confirmed');
 select * into o from public.store_orders where id=oid;
 perform public.update_cod_order(oid,o.updated_at,'shipped','Test courier','TEST-123');
 select * into o from public.store_orders where id=oid;
 perform public.update_cod_order(oid,o.updated_at,'delivered');
end $$;
reset role;
do $$ begin
 if exists(select 1 from public.email_jobs where recipient='owner-test@example.invalid') then raise exception 'Test orders queued email';end if;
end $$;
update public.checkout_settings set enabled=true;
set local role authenticated;
select set_config('request.jwt.claim.sub','7e570000-0000-4000-8000-000000000002',true);
do $$ begin
 if public.quote_cod_order('[{"productId":"owner-test-fixture","size":"M","quantity":1}]')->>'is_test' <> 'true' then raise exception 'Test quote lost marker after public launch';end if;
 if exists(select 1 from public.store_orders where is_test) then raise exception 'Other customer can read owner test orders';end if;
end $$;
select set_config('request.jwt.claim.sub','7e570000-0000-4000-8000-000000000001',true);
do $$ begin
 begin perform public.quote_cod_order('[{"productId":"owner-test-fixture","size":"M","quantity":1},{"productId":"real-test-fixture","size":"M","quantity":1}]');raise exception 'Mixed real/test bag accepted';
 exception when raise_exception then if sqlerrm <> 'checkout:test_mixed' then raise;end if;end;
end $$;
reset role;
rollback;
