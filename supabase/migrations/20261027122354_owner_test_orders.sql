-- Owner-only rehearsal orders use simulated stock and never enter the email queue.
begin;
alter table public.catalog_products add column test_only boolean not null default false;
alter table public.store_orders add column is_test boolean not null default false;

create or replace function store_internal.quote_cod_order(p_items jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  item jsonb; product public.catalog_products%rowtype; config public.checkout_settings%rowtype;
  lines jsonb := '[]'; subtotal bigint := 0; qty integer; stock integer;
  owner_access boolean; test_order boolean := false; real_order boolean := false;
begin
  if auth.uid() is null then raise exception 'checkout:sign_in'; end if;
  select * into config from public.checkout_settings where id;
  select exists(select 1 from public.store_owners where user_id = auth.uid()) into owner_access;
  if not coalesce(config.enabled,false) and not owner_access then raise exception 'checkout:closed'; end if;
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
    if product.test_only then
      if not owner_access then raise exception 'checkout:test_owner_only'; end if;
      test_order := true;
    else
      real_order := true;
      if not coalesce(config.enabled,false) then raise exception 'checkout:closed'; end if;
    end if;
    if test_order and real_order then raise exception 'checkout:test_mixed'; end if;
    qty := (item->>'quantity')::integer;
    select (s->>'stock')::integer into stock from jsonb_array_elements(product.sizes) s where s->>'code' = item->>'size';
    if stock is null or stock < qty then raise exception 'checkout:stock'; end if;
    subtotal := subtotal + product.price_minor::bigint * qty;
    lines := lines || jsonb_build_array(jsonb_build_object('productId',product.id,'slug',product.slug,'name',product.name,
      'color',product.color,'size',item->>'size','quantity',qty,'unit_minor',product.price_minor,'line_minor',product.price_minor::bigint * qty));
  end loop;
  if subtotal + config.shipping_minor > 100000000 then raise exception 'checkout:limit'; end if;
  return jsonb_build_object('items',lines,'currency','PKR','subtotal_minor',subtotal,'shipping_minor',config.shipping_minor,'total_minor',subtotal+config.shipping_minor)
    || case when test_order then '{"is_test":true}'::jsonb else '{}'::jsonb end;
end;
$$;

create or replace function store_internal.place_cod_order(p_request_id uuid, p_items jsonb, p_address jsonb, p_quote jsonb) returns uuid
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
  insert into public.store_orders(user_id,request_id,request_fingerprint,items,address,subtotal_minor,shipping_minor,total_minor,is_test)
    values(uid,p_request_id,fingerprint,quote->'items',
      jsonb_build_object('recipient',trim(p_address->>'recipient'),'phone',p_address->>'phone','line1',trim(p_address->>'line1'),
        'line2',coalesce(p_address->>'line2',''),'city',trim(p_address->>'city'),'province',trim(p_address->>'province'),
        'postal_code',coalesce(p_address->>'postal_code',''),'country','PK'),
      (quote->>'subtotal_minor')::integer,(quote->>'shipping_minor')::integer,(quote->>'total_minor')::integer,coalesce((quote->>'is_test')::boolean,false)) returning id into result;
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

create or replace function store_internal.queue_order_email() returns trigger language plpgsql security definer set search_path='' as $$
declare recipient text;oid uuid;
begin
 if exists(select 1 from public.store_orders where id=new.order_id and is_test) then return new;end if;
 select u.email,o.id into recipient,oid from public.store_orders o join auth.users u on u.id=o.user_id where o.id=new.order_id and u.email_confirmed_at is not null;
 if recipient is not null then insert into public.email_jobs(dedupe_key,kind,recipient,payload) values('order-event:'||new.id,'order_status',recipient,jsonb_build_object('orderId',oid,'status',new.status)) on conflict(dedupe_key) do nothing;end if;return new;
end;$$;


notify pgrst,'reload schema';
commit;
