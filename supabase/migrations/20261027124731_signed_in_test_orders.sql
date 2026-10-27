-- Any signed-in customer can rehearse with test merchandise.
-- Real merchandise still requires enabled public checkout. Admin checks are unchanged.
begin;
create or replace function store_internal.quote_cod_order(p_items jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  item jsonb; product public.catalog_products%rowtype; config public.checkout_settings%rowtype;
  lines jsonb := '[]'; subtotal bigint := 0; qty integer; stock integer;
  test_order boolean := false; real_order boolean := false;
begin
  if auth.uid() is null then raise exception 'checkout:sign_in'; end if;
  select * into config from public.checkout_settings where id;
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
notify pgrst,'reload schema';
commit;
