-- Private customer data. Supabase Auth owns credentials and sessions.
create table public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 100),
  phone text not null default '' check (char_length(phone) <= 30)
);
create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 40),
  recipient text not null check (char_length(recipient) between 1 and 100),
  phone text not null check (char_length(phone) between 7 and 30),
  line1 text not null check (char_length(line1) between 1 and 150),
  line2 text not null default '' check (char_length(line2) <= 150),
  city text not null check (char_length(city) between 1 and 80),
  province text not null check (char_length(province) between 1 and 80),
  postal_code text not null default '' check (char_length(postal_code) <= 20),
  country text not null default 'PK' check (country ~ '^[A-Z]{2}$'),
  created_at timestamptz not null default now()
);
create index customer_addresses_user_idx on public.customer_addresses(user_id);
create table public.customer_bag (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.catalog_products(id) on delete cascade,
  size text not null check (char_length(size) between 1 and 20),
  quantity integer not null check (quantity between 1 and 100),
  primary key (user_id, product_id, size)
);
create index customer_bag_product_idx on public.customer_bag(product_id);
create table public.customer_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.catalog_products(id) on delete cascade,
  primary key (user_id, product_id)
);
create index customer_favorites_product_idx on public.customer_favorites(product_id);
create table public.customer_guest_merges (
  user_id uuid not null references auth.users(id) on delete cascade,
  merge_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, merge_id)
);
do $$ declare t text; begin
  foreach t in array array['customer_profiles','customer_addresses','customer_bag','customer_favorites','customer_guest_merges'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy "Own customer records" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- Invoker privileges retain RLS; the lock serializes operations for this user.
create function public.customer_store_action(action text, payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  uid uuid := auth.uid(); pid text; sz text; qty integer; stock integer;
  item jsonb; merged uuid; saved boolean; result jsonb;
begin
  if uid is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  if action = 'merge' then
    merged := (payload->>'mergeId')::uuid;
    if merged is null or jsonb_typeof(payload->'bag') <> 'array' or jsonb_typeof(payload->'favorites') <> 'array'
       or jsonb_array_length(payload->'bag') > 100 or jsonb_array_length(payload->'favorites') > 100 then
      raise exception 'Invalid guest selections';
    end if;
    if not exists (select 1 from public.customer_guest_merges where user_id = uid and merge_id = merged) then
      for item in select value from jsonb_array_elements(payload->'bag') loop
        pid := item->>'productId'; sz := item->>'size'; qty := (item->>'quantity')::integer;
        select least(100, (s->>'stock')::integer) into stock
          from public.catalog_products p cross join lateral jsonb_array_elements(p.sizes) s
          where p.id = pid and p.published and s->>'code' = sz;
        if stock > 0 and qty between 1 and 100 then
          insert into public.customer_bag values (uid, pid, sz, least(qty, stock))
          on conflict (user_id, product_id, size) do update set quantity = least(stock, public.customer_bag.quantity + excluded.quantity);
        end if;
      end loop;
      insert into public.customer_favorites(user_id, product_id)
        select uid, p.id from public.catalog_products p where p.published and p.id in (select jsonb_array_elements_text(payload->'favorites'))
        on conflict do nothing;
      insert into public.customer_guest_merges values (uid, merged, now());
    end if;
  elsif action in ('favorite', 'add', 'quantity', 'remove', 'move') then
    pid := payload->>'productId'; sz := payload->>'size';
    if not exists (select 1 from public.catalog_products where id = pid and published) then raise exception 'Product unavailable'; end if;
    if action in ('favorite','move') then
      select exists(select 1 from public.customer_favorites where user_id = uid and product_id = pid) into saved;
      if action = 'favorite' and saved then
        delete from public.customer_favorites where user_id = uid and product_id = pid;
      else
        insert into public.customer_favorites values (uid, pid) on conflict do nothing;
      end if;
    end if;
    if action in ('remove','move') then
      delete from public.customer_bag where user_id = uid and product_id = pid and size = sz;
    elsif action in ('add','quantity') then
      select least(100, (s->>'stock')::integer) into stock
        from public.catalog_products p cross join lateral jsonb_array_elements(p.sizes) s
        where p.id = pid and p.published and s->>'code' = sz;
      if action = 'add' then
        select coalesce((select quantity from public.customer_bag where user_id = uid and product_id = pid and size = sz),0) + 1 into qty;
      else qty := (payload->>'quantity')::integer; end if;
      if stock is null or qty is null or qty < 1 or qty > stock then raise exception 'Size or quantity unavailable'; end if;
      insert into public.customer_bag values (uid, pid, sz, qty)
        on conflict (user_id, product_id, size) do update set quantity = excluded.quantity;
    end if;
  elsif action <> 'read' then raise exception 'Unknown shopping action'; end if;
  select jsonb_build_object(
    'favorites', coalesce((select jsonb_agg(product_id order by product_id) from public.customer_favorites where user_id = uid), '[]'::jsonb),
    'bag', coalesce((select jsonb_agg(jsonb_build_object('productId', product_id, 'size', size, 'quantity', quantity) order by product_id, size) from public.customer_bag where user_id = uid), '[]'::jsonb)
  ) into result;
  return result;
end $$;
revoke all on function public.customer_store_action(text,jsonb) from public, anon;
grant execute on function public.customer_store_action(text,jsonb) to authenticated;
