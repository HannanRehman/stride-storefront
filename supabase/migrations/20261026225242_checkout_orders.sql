-- Local implementation. Closed by default; activation is a separate launch action.
begin;
alter table public.catalog_products add column orderable boolean not null default false;
alter table public.catalog_products add constraint catalog_orderable_pkr check (not orderable or (currency = 'PKR' and price_minor > 0));

create table public.checkout_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  shipping_minor integer not null default 25000 check (shipping_minor between 0 and 1000000),
  updated_at timestamptz not null default clock_timestamp()
);
insert into public.checkout_settings(id) values (true);
alter table public.checkout_settings enable row level security;
revoke all on public.checkout_settings from anon, authenticated;
grant select on public.checkout_settings to anon, authenticated;
create policy "Read checkout availability" on public.checkout_settings for select to anon, authenticated using (true);

create table public.store_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  request_id uuid not null,
  request_fingerprint text not null,
  status text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  payment_method text not null default 'cod' check (payment_method = 'cod'),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','collected')),
  currency text not null default 'PKR' check (currency = 'PKR'),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 20),
  address jsonb not null check (jsonb_typeof(address) = 'object'),
  subtotal_minor integer not null check (subtotal_minor > 0),
  shipping_minor integer not null check (shipping_minor >= 0),
  total_minor integer not null check (total_minor = subtotal_minor + shipping_minor and total_minor <= 100000000),
  courier text not null default '',
  tracking_reference text not null default '',
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique(user_id, request_id)
);
create index store_orders_customer_created_idx on public.store_orders(user_id, created_at desc, id);
create index store_orders_created_idx on public.store_orders(created_at desc, id);
create index store_orders_status_created_idx on public.store_orders(status, created_at desc, id);
alter table public.store_orders enable row level security;
revoke all on public.store_orders from anon, authenticated;
grant select on public.store_orders to authenticated;
create policy "Read own orders or manage as owner" on public.store_orders for select to authenticated using (
  user_id = (select auth.uid()) or (select exists(select 1 from public.store_owners where user_id = (select auth.uid())))
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.store_orders(id) on delete restrict,
  status text not null check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  created_at timestamptz not null default clock_timestamp()
);
create index order_events_order_created_idx on public.order_events(order_id, created_at, id);
alter table public.order_events enable row level security;
revoke all on public.order_events from anon, authenticated;
grant select on public.order_events to authenticated;
create policy "Read visible order events" on public.order_events for select to authenticated using (
  exists(select 1 from public.store_orders o where o.id = order_id)
);

-- Exposed RPCs explicitly check identity. No direct table writes are granted.
create function public.quote_cod_order(p_items jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  item jsonb; product public.catalog_products%rowtype; config public.checkout_settings%rowtype;
  lines jsonb := '[]'; subtotal bigint := 0; qty integer; stock integer;
begin
  if auth.uid() is null then raise exception 'checkout:sign_in'; end if;
  select * into config from public.checkout_settings where id;
  if not coalesce(config.enabled,false) then raise exception 'checkout:closed'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' then raise exception 'checkout:invalid_items'; end if;
  if jsonb_array_length(p_items) not between 1 and 20 then raise exception 'checkout:invalid_items'; end if;
  if exists(select 1 from jsonb_array_elements(p_items) i where jsonb_typeof(i) is distinct from 'object'
    or jsonb_typeof(i->'productId') is distinct from 'string' or length(i->>'productId') not between 1 and 100
    or jsonb_typeof(i->'size') is distinct from 'string' or length(i->>'size') not between 1 and 16
    or jsonb_typeof(i->'quantity') is distinct from 'number' or not coalesce((i->>'quantity') ~ '^([1-9]|10)$',false))
    then raise exception 'checkout:invalid_items'; end if;
  if (select count(*) <> count(distinct (i->>'productId', i->>'size')) from jsonb_array_elements(p_items) i)
    then raise exception 'checkout:invalid_items'; end if;
  for item in select value from jsonb_array_elements(p_items) order by value->>'productId', value->>'size' loop
    select * into product from public.catalog_products where id = item->>'productId';
    if not found or not product.published or not product.orderable or product.currency <> 'PKR' or product.price_minor <= 0
      then raise exception 'checkout:unavailable'; end if;
    qty := (item->>'quantity')::integer;
    select (s->>'stock')::integer into stock from jsonb_array_elements(product.sizes) s where s->>'code' = item->>'size';
    if stock is null or stock < qty then raise exception 'checkout:stock'; end if;
    subtotal := subtotal + product.price_minor::bigint * qty;
    lines := lines || jsonb_build_array(jsonb_build_object('productId',product.id,'slug',product.slug,'name',product.name,
      'color',product.color,'size',item->>'size','quantity',qty,'unit_minor',product.price_minor,'line_minor',product.price_minor::bigint * qty));
  end loop;
  if subtotal + config.shipping_minor > 100000000 then raise exception 'checkout:limit'; end if;
  return jsonb_build_object('items',lines,'currency','PKR','subtotal_minor',subtotal,'shipping_minor',config.shipping_minor,'total_minor',subtotal+config.shipping_minor);
end;
$$;

create function public.place_cod_order(p_request_id uuid, p_items jsonb, p_address jsonb, p_quote jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid(); existing public.store_orders%rowtype; fingerprint text;
  quote jsonb; item jsonb; product public.catalog_products%rowtype; result uuid; field text;
begin
  if uid is null then raise exception 'checkout:sign_in'; end if;
  if p_request_id is null then raise exception 'checkout:invalid_request'; end if;
  -- Serializes this customer's retries, order rate limit and first-time submissions.
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  fingerprint := encode(sha256(convert_to(jsonb_build_object('items',p_items,'address',p_address,'quote',p_quote)::text,'UTF8')),'hex');
  select * into existing from public.store_orders where user_id = uid and request_id = p_request_id;
  if found then
    if existing.request_fingerprint <> fingerprint then raise exception 'checkout:request_changed'; end if;
    return existing.id;
  end if;
  if jsonb_typeof(p_address) is distinct from 'object' then raise exception 'checkout:address'; end if;
  foreach field in array array['recipient','phone','line1','city','province'] loop
    if jsonb_typeof(p_address->field) is distinct from 'string' or length(trim(p_address->>field)) not between 1 and 150
      or (p_address->>field) ~ '[[:cntrl:]]'
      then raise exception 'checkout:address'; end if;
  end loop;
  if length(trim(p_address->>'recipient')) > 100 or length(trim(p_address->>'city')) > 80 or length(trim(p_address->>'province')) > 80
    or (p_address ? 'line2' and jsonb_typeof(p_address->'line2') <> 'string')
    or (p_address ? 'postal_code' and jsonb_typeof(p_address->'postal_code') <> 'string')
    or coalesce(p_address->>'line2','') ~ '[[:cntrl:]]' then raise exception 'checkout:address'; end if;
  if p_address->>'country' is distinct from 'PK' or not coalesce((p_address->>'phone') ~ '^03[0-9]{9}$',false)
    or length(coalesce(p_address->>'line2','')) > 150
    or (coalesce(p_address->>'postal_code','') <> '' and not (p_address->>'postal_code') ~ '^[0-9]{5}$')
    then raise exception 'checkout:address'; end if;
  if (select count(*) from public.store_orders where user_id = uid and created_at > clock_timestamp() - interval '1 hour') >= 5
    then raise exception 'checkout:rate_limit'; end if;
  -- Lock settings, then all products in ID order before reading the authoritative quote.
  perform 1 from public.checkout_settings where id for share;
  if jsonb_typeof(p_items) is distinct from 'array' then raise exception 'checkout:invalid_items'; end if;
  if jsonb_array_length(p_items) not between 1 and 20 then raise exception 'checkout:invalid_items'; end if;
  perform 1 from public.catalog_products where id in (select i->>'productId' from jsonb_array_elements(p_items) i) order by id for update;
  quote := public.quote_cod_order(p_items);
  if quote is distinct from p_quote then raise exception 'checkout:price_changed'; end if;
  for item in select value from jsonb_array_elements(quote->'items') loop
    update public.catalog_products set sizes = (
      select jsonb_agg(case when s->>'code' = item->>'size'
        then jsonb_set(s,'{stock}',to_jsonb((s->>'stock')::integer - (item->>'quantity')::integer)) else s end order by ord)
      from jsonb_array_elements(sizes) with ordinality as v(s,ord)
    ) where id = item->>'productId';
  end loop;
  insert into public.store_orders(user_id,request_id,request_fingerprint,items,address,subtotal_minor,shipping_minor,total_minor)
    values(uid,p_request_id,fingerprint,quote->'items',
      jsonb_build_object('recipient',trim(p_address->>'recipient'),'phone',p_address->>'phone','line1',trim(p_address->>'line1'),
        'line2',coalesce(p_address->>'line2',''),'city',trim(p_address->>'city'),'province',trim(p_address->>'province'),
        'postal_code',coalesce(p_address->>'postal_code',''),'country','PK'),
      (quote->>'subtotal_minor')::integer,(quote->>'shipping_minor')::integer,(quote->>'total_minor')::integer) returning id into result;
  insert into public.order_events(order_id,status) values(result,'pending');
  -- The same customer lock serializes bag actions. Remove purchased quantities,
  -- preserving any extra quantities or unrelated selections added elsewhere.
  for item in select value from jsonb_array_elements(quote->'items') loop
    delete from public.customer_bag where user_id = uid and product_id = item->>'productId' and size = item->>'size' and quantity <= (item->>'quantity')::integer;
    update public.customer_bag set quantity = quantity - (item->>'quantity')::integer
      where user_id = uid and product_id = item->>'productId' and size = item->>'size';
  end loop;
  return result;
end;
$$;

create function public.update_cod_order(p_id uuid, p_updated_at timestamptz, p_status text, p_courier text default '', p_tracking text default '') returns uuid
language plpgsql security definer set search_path = '' as $$
declare current_order public.store_orders%rowtype; item jsonb; product public.catalog_products%rowtype; stock integer;
begin
  if auth.uid() is null or not exists(select 1 from public.store_owners where user_id = auth.uid()) then raise exception 'checkout:owner_only'; end if;
  select * into current_order from public.store_orders where id = p_id for update;
  if not found then raise exception 'checkout:not_found'; end if;
  if current_order.updated_at is distinct from p_updated_at then raise exception 'checkout:stale'; end if;
  if not coalesce((current_order.status = 'pending' and p_status in ('confirmed','cancelled'))
    or (current_order.status = 'confirmed' and p_status in ('shipped','cancelled'))
    or (current_order.status = 'shipped' and p_status = 'delivered'),false)
    then raise exception 'checkout:transition'; end if;
  if p_status = 'shipped' and (length(trim(coalesce(p_courier,''))) not between 1 and 80 or length(trim(coalesce(p_tracking,''))) not between 1 and 120)
    then raise exception 'checkout:tracking'; end if;
  if p_status = 'cancelled' then
    perform 1 from public.catalog_products where id in (select i->>'productId' from jsonb_array_elements(current_order.items) i) order by id for update;
    for item in select value from jsonb_array_elements(current_order.items) loop
      select * into product from public.catalog_products where id = item->>'productId';
      select (s->>'stock')::integer into stock from jsonb_array_elements(product.sizes) s where s->>'code' = item->>'size';
      if not found or stock is null or stock + (item->>'quantity')::integer > 100 then raise exception 'checkout:restock'; end if;
      update public.catalog_products set sizes = (
        select jsonb_agg(case when s->>'code' = item->>'size'
          then jsonb_set(s,'{stock}',to_jsonb((s->>'stock')::integer + (item->>'quantity')::integer)) else s end order by ord)
        from jsonb_array_elements(sizes) with ordinality as v(s,ord)
      ) where id = product.id;
    end loop;
  end if;
  update public.store_orders set status = p_status, payment_status = case when p_status = 'delivered' then 'collected' else 'unpaid' end,
    courier = case when p_status = 'shipped' then trim(p_courier) else courier end,
    tracking_reference = case when p_status = 'shipped' then trim(p_tracking) else tracking_reference end,
    updated_at = clock_timestamp() where id = p_id;
  insert into public.order_events(order_id,status) values(p_id,p_status);
  return p_id;
end;
$$;

create function public.set_checkout_settings(p_enabled boolean, p_shipping_minor integer, p_updated_at timestamptz) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists(select 1 from public.store_owners where user_id = auth.uid()) then raise exception 'checkout:owner_only'; end if;
  if p_enabled is null or p_shipping_minor is null or p_shipping_minor not between 0 and 1000000 then raise exception 'checkout:settings'; end if;
  update public.checkout_settings set enabled = p_enabled, shipping_minor = p_shipping_minor, updated_at = clock_timestamp()
    where id and updated_at = p_updated_at;
  if not found then raise exception 'checkout:stale'; end if;
  return true;
end;
$$;
revoke all on function public.quote_cod_order(jsonb) from public, anon;
revoke all on function public.place_cod_order(uuid,jsonb,jsonb,jsonb) from public, anon;
revoke all on function public.update_cod_order(uuid,timestamptz,text,text,text) from public, anon;
revoke all on function public.set_checkout_settings(boolean,integer,timestamptz) from public, anon;
grant execute on function public.quote_cod_order(jsonb), public.place_cod_order(uuid,jsonb,jsonb,jsonb),
  public.update_cod_order(uuid,timestamptz,text,text,text), public.set_checkout_settings(boolean,integer,timestamptz) to authenticated;
commit;
