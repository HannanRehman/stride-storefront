-- Assertions run with RLS enforced. Entire fixture rolls back.
begin;
insert into auth.users(id) values ('6a78d154-0000-4000-8000-000000000001'), ('6a78d154-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub', '6a78d154-0000-4000-8000-000000000001', true);
insert into public.customer_profiles values ('6a78d154-0000-4000-8000-000000000001', 'RLS test A', '');
insert into public.customer_addresses(user_id,label,recipient,phone,line1,city,province) values ('6a78d154-0000-4000-8000-000000000001','Home','RLS test A','03001234567','Test address','Lahore','Punjab');
select public.customer_store_action('merge', '{"mergeId":"6a78d154-0000-4000-8000-000000000003","favorites":["pace-01-men"],"bag":[{"productId":"pace-01-men","size":"10","quantity":2}]}'::jsonb);
select public.customer_store_action('merge', '{"mergeId":"6a78d154-0000-4000-8000-000000000003","favorites":["pace-01-men"],"bag":[{"productId":"pace-01-men","size":"10","quantity":2}]}'::jsonb);
do $$ begin
  if (select quantity from public.customer_bag where product_id='pace-01-men' and size='10') <> 2 then raise exception 'Guest merge is not idempotent'; end if;
  if (select count(*) from public.customer_guest_merges) <> 1 then raise exception 'Merge receipt mismatch'; end if;
  begin
    perform public.customer_store_action('quantity', '{"productId":"pace-01-men","size":"10","quantity":99}');
    raise exception 'Invalid quantity accepted';
  exception when raise_exception then if sqlerrm = 'Invalid quantity accepted' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub', '6a78d154-0000-4000-8000-000000000002', true);
do $$ begin
  if exists(select 1 from public.customer_profiles) or exists(select 1 from public.customer_addresses) or exists(select 1 from public.customer_bag) or exists(select 1 from public.customer_favorites) or exists(select 1 from public.customer_guest_merges) then raise exception 'Another user can read customer data'; end if;
  update public.customer_profiles set full_name='Tampered' where user_id='6a78d154-0000-4000-8000-000000000001';
  if found then raise exception 'Another user can update customer data'; end if;
  begin
    insert into public.customer_profiles values ('6a78d154-0000-4000-8000-000000000001', 'Tampered', '');
    raise exception 'Cross-user insertion accepted';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', '6a78d154-0000-4000-8000-000000000001', true);
select public.customer_store_action('move', '{"productId":"pace-01-men","size":"10"}');
do $$ begin
  if exists(select 1 from public.customer_bag) or not exists(select 1 from public.customer_favorites where product_id='pace-01-men') then raise exception 'Bag to favorite movement failed'; end if;
end $$;
set local role anon;
do $$ begin
  begin perform 1 from public.customer_profiles; raise exception 'Anonymous read accepted'; exception when insufficient_privilege then null; end;
  begin perform public.customer_store_action('read'); raise exception 'Anonymous RPC accepted'; exception when insufficient_privilege then null; end;
end $$;
rollback;
