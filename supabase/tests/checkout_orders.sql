-- Transactional fixtures: no real orders, users or catalog edits survive.
begin;
insert into auth.users(id) values ('c0d00000-0000-4000-8000-000000000001'),('c0d00000-0000-4000-8000-000000000002'),('c0d00000-0000-4000-8000-000000000003');
insert into public.store_owners(user_id) values('c0d00000-0000-4000-8000-000000000001');
insert into public.catalog_products(id,slug,name,subtitle,audience,category,sport,collection,price_minor,currency,image,color,color_hex,sizes,description,featured_rank,published_at,published,orderable)
values('cod-test','cod-test','Real hoodie','Hoodie','unisex','clothing','Lifestyle','everyday',700000,'PKR','/images/tee.webp','Navy','#17283b','[{"code":"M","stock":3},{"code":"L","stock":2}]','Test product',0,current_date,true,true);
insert into public.customer_bag(user_id,product_id,size,quantity) values
  ('c0d00000-0000-4000-8000-000000000002','cod-test','M',3),
  ('c0d00000-0000-4000-8000-000000000002','cod-test','L',2);
set local role anon;
do $$ begin
  begin perform public.quote_cod_order('[]'); raise exception 'Anonymous quote accepted'; exception when insufficient_privilege then null; end;
  begin perform public.place_cod_order(gen_random_uuid(),'[]','{}','{}'); raise exception 'Anonymous order accepted'; exception when insufficient_privilege then null; end;
  begin perform * from public.store_orders; raise exception 'Anonymous orders visible'; exception when insufficient_privilege then null; end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','c0d00000-0000-4000-8000-000000000002',true);
do $$ begin
  begin perform public.quote_cod_order('[{"productId":"cod-test","size":"M","quantity":1}]'); raise exception 'Closed checkout accepted'; exception when raise_exception then if sqlerrm <> 'checkout:closed' then raise; end if; end;
  begin update public.checkout_settings set enabled=true; raise exception 'Customer enabled checkout'; exception when insufficient_privilege then null; end;
  begin perform public.set_checkout_settings(true,0,now()); raise exception 'Customer changed checkout settings'; exception when raise_exception then if sqlerrm <> 'checkout:owner_only' then raise; end if; end;
end $$;
reset role;
update public.checkout_settings set enabled=true;
set local role authenticated;
select set_config('request.jwt.claim.sub','c0d00000-0000-4000-8000-000000000002',true);
do $$ declare
  items jsonb := '[{"productId":"cod-test","size":"M","quantity":2}]';
  addr jsonb := '{"recipient":"Test Customer","phone":"03001234567","line1":"Test Street","line2":"","city":"Lahore","province":"Punjab","postal_code":"54000","country":"PK"}';
  quote jsonb; oid uuid; replay uuid;
begin
  quote := public.quote_cod_order(items);
  if (quote->>'total_minor')::integer <> 1425000 then raise exception 'Incorrect authoritative quote'; end if;
  begin perform public.place_cod_order('c0d00000-0000-4000-8000-000000000010',items,addr,jsonb_set(quote,'{total_minor}','1')); raise exception 'Tampered total accepted'; exception when raise_exception then if sqlerrm <> 'checkout:price_changed' then raise; end if; end;
  begin perform public.quote_cod_order('[{"productId":"cod-test","size":"M","quantity":-1}]'); raise exception 'Negative quantity accepted'; exception when raise_exception then if sqlerrm <> 'checkout:invalid_items' then raise; end if; end;
  begin perform public.quote_cod_order(items || items); raise exception 'Duplicate size accepted'; exception when raise_exception then if sqlerrm <> 'checkout:invalid_items' then raise; end if; end;
  begin perform public.quote_cod_order('[{"productId":"cod-test","size":"M","quantity":4}]'); raise exception 'Stock limit bypassed'; exception when raise_exception then if sqlerrm <> 'checkout:stock' then raise; end if; end;
  begin perform public.place_cod_order(gen_random_uuid(),items,jsonb_set(addr,'{country}','"US"'),quote); raise exception 'Foreign address accepted'; exception when raise_exception then if sqlerrm <> 'checkout:address' then raise; end if; end;
  oid := public.place_cod_order('c0d00000-0000-4000-8000-000000000011',items,addr,quote);
  replay := public.place_cod_order('c0d00000-0000-4000-8000-000000000011',items,addr,quote);
  if oid <> replay or (select count(*) from public.store_orders) <> 1 then raise exception 'Duplicate order created'; end if;
  if (select quantity from public.customer_bag where size='M') <> 1 or (select quantity from public.customer_bag where size='L') <> 2 then raise exception 'Checkout removed unrelated/additional bag quantities'; end if;
  if (select (sizes->0->>'stock')::integer from public.catalog_products where id='cod-test') <> 1 then raise exception 'Stock decremented more than once'; end if;
  begin perform public.place_cod_order('c0d00000-0000-4000-8000-000000000011',items,jsonb_set(addr,'{city}','"Karachi"'),quote); raise exception 'Changed retry accepted'; exception when raise_exception then if sqlerrm <> 'checkout:request_changed' then raise; end if; end;
  begin perform public.place_cod_order(gen_random_uuid(),items,addr,quote); raise exception 'Oversold stock'; exception when raise_exception then if sqlerrm <> 'checkout:stock' then raise; end if; end;
  begin update public.store_orders set status='delivered' where id=oid; raise exception 'Direct customer order write'; exception when insufficient_privilege then null; end;
  begin perform public.update_cod_order(oid,now(),'delivered'); raise exception 'Customer status write'; exception when raise_exception then if sqlerrm <> 'checkout:owner_only' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','c0d00000-0000-4000-8000-000000000003',true);
do $$ begin
  if exists(select 1 from public.store_orders) or exists(select 1 from public.order_events) then raise exception 'Another customer sees private order'; end if;
end $$;
select set_config('request.jwt.claim.sub','c0d00000-0000-4000-8000-000000000001',true);
do $$ declare o public.store_orders%rowtype; begin
  select * into o from public.store_orders limit 1;
  if o.id is null then raise exception 'Owner cannot read orders'; end if;
  begin perform public.update_cod_order(o.id,o.updated_at,'delivered'); raise exception 'Skipped fulfillment accepted'; exception when raise_exception then if sqlerrm <> 'checkout:transition' then raise; end if; end;
  perform public.update_cod_order(o.id,o.updated_at,'confirmed');
  begin perform public.update_cod_order(o.id,o.updated_at,'cancelled'); raise exception 'Stale status accepted'; exception when raise_exception then if sqlerrm <> 'checkout:stale' then raise; end if; end;
  select * into o from public.store_orders where id=o.id;
  perform public.update_cod_order(o.id,o.updated_at,'cancelled');
  if (select (sizes->0->>'stock')::integer from public.catalog_products where id='cod-test') <> 3 then raise exception 'Cancellation did not restore stock'; end if;
  select * into o from public.store_orders where id=o.id;
  begin perform public.update_cod_order(o.id,o.updated_at,'cancelled'); raise exception 'Repeated cancellation accepted'; exception when raise_exception then if sqlerrm <> 'checkout:transition' then raise; end if; end;
  if (select count(*) from public.order_events where order_id=o.id) <> 3 then raise exception 'Incorrect status history'; end if;
end $$;
-- New order: shipping, mandatory tracking, delivered means verified cash collection.
select set_config('request.jwt.claim.sub','c0d00000-0000-4000-8000-000000000002',true);
select public.place_cod_order('c0d00000-0000-4000-8000-000000000012','[{"productId":"cod-test","size":"L","quantity":1}]',
  '{"recipient":"Test Customer","phone":"03001234567","line1":"Test Street","city":"Lahore","province":"Punjab","country":"PK"}',
  public.quote_cod_order('[{"productId":"cod-test","size":"L","quantity":1}]'));
select set_config('request.jwt.claim.sub','c0d00000-0000-4000-8000-000000000001',true);
do $$ declare o public.store_orders%rowtype; begin
  select * into o from public.store_orders where request_id='c0d00000-0000-4000-8000-000000000012';
  perform public.update_cod_order(o.id,o.updated_at,'confirmed');
  select * into o from public.store_orders where id=o.id;
  begin perform public.update_cod_order(o.id,o.updated_at,'shipped'); raise exception 'Tracking not required'; exception when raise_exception then if sqlerrm <> 'checkout:tracking' then raise; end if; end;
  perform public.update_cod_order(o.id,o.updated_at,'shipped','Test courier','TRACK-123');
  select * into o from public.store_orders where id=o.id;
  begin perform public.update_cod_order(o.id,o.updated_at,'cancelled'); raise exception 'Shipped cancellation accepted'; exception when raise_exception then if sqlerrm <> 'checkout:transition' then raise; end if; end;
  perform public.update_cod_order(o.id,o.updated_at,'delivered');
  select * into o from public.store_orders where id=o.id;
  if o.payment_status <> 'collected' or o.tracking_reference <> 'TRACK-123' then raise exception 'Delivery payment/tracking failed'; end if;
end $$;
reset role;
-- A response retry still resolves the original order after ordering closes.
update public.checkout_settings set enabled=false;
set local role authenticated;
select set_config('request.jwt.claim.sub','c0d00000-0000-4000-8000-000000000002',true);
do $$ declare o public.store_orders%rowtype; got uuid; begin
  select * into o from public.store_orders where request_id='c0d00000-0000-4000-8000-000000000012';
  got := public.place_cod_order(o.request_id,'[{"productId":"cod-test","size":"L","quantity":1}]',
    '{"recipient":"Test Customer","phone":"03001234567","line1":"Test Street","city":"Lahore","province":"Punjab","country":"PK"}',
    jsonb_build_object('items',o.items,'currency','PKR','subtotal_minor',o.subtotal_minor,'shipping_minor',o.shipping_minor,'total_minor',o.total_minor));
  if got <> o.id then raise exception 'Closed-store retry duplicated order'; end if;
end $$;
reset role;
-- Catalog edits cannot alter old order snapshots; noneligible products cannot be ordered.
update public.checkout_settings set enabled=true;
update public.catalog_products set name='Changed name',price_minor=800000,orderable=false where id='cod-test';
set local role authenticated;
select set_config('request.jwt.claim.sub','c0d00000-0000-4000-8000-000000000002',true);
do $$ begin
  if exists(select 1 from public.store_orders where items->0->>'name' <> 'Real hoodie' or (items->0->>'unit_minor')::integer <> 700000) then raise exception 'Order snapshot changed'; end if;
  begin perform public.quote_cod_order('[{"productId":"cod-test","size":"M","quantity":1}]'); raise exception 'Noneligible item accepted'; exception when raise_exception then if sqlerrm <> 'checkout:unavailable' then raise; end if; end;
end $$;
reset role;
update public.catalog_products set orderable=true,sizes='[{"code":"M","stock":10},{"code":"L","stock":1}]' where id='cod-test';
set local role authenticated;
select set_config('request.jwt.claim.sub','c0d00000-0000-4000-8000-000000000003',true);
do $$ declare i integer; items jsonb := '[{"productId":"cod-test","size":"M","quantity":1}]';
  addr jsonb := '{"recipient":"Test Customer","phone":"03001234567","line1":"Test Street","city":"Lahore","province":"Punjab","country":"PK"}';
begin
  for i in 1..5 loop perform public.place_cod_order(gen_random_uuid(),items,addr,public.quote_cod_order(items)); end loop;
  begin perform public.place_cod_order(gen_random_uuid(),items,addr,public.quote_cod_order(items)); raise exception 'Order rate limit bypassed'; exception when raise_exception then if sqlerrm <> 'checkout:rate_limit' then raise; end if; end;
  if (select (sizes->0->>'stock')::integer from public.catalog_products where id='cod-test') <> 5 then raise exception 'Rejected rate-limited order reserved stock'; end if;
end $$;
reset role;
-- Owner stock edits cannot make cancellation silently discard reserved units.
update public.catalog_products set sizes='[{"code":"M","stock":100},{"code":"L","stock":1}]' where id='cod-test';
set local role authenticated;
select set_config('request.jwt.claim.sub','c0d00000-0000-4000-8000-000000000001',true);
do $$ declare o public.store_orders%rowtype; begin
  select * into o from public.store_orders where status='pending' limit 1;
  begin perform public.update_cod_order(o.id,o.updated_at,'cancelled'); raise exception 'Overflowing restock accepted'; exception when raise_exception then if sqlerrm <> 'checkout:restock' then raise; end if; end;
  if (select status from public.store_orders where id=o.id) <> 'pending' then raise exception 'Failed cancellation partially committed'; end if;
end $$;
rollback;
