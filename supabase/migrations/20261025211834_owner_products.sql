-- Prepared locally. Apply to the hosted project only after owner review.
begin;
create table public.store_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.store_owners enable row level security;
revoke all on public.store_owners from anon, authenticated;
grant select on public.store_owners to authenticated;
create policy "Read own owner membership" on public.store_owners for select to authenticated
  using (user_id = (select auth.uid()));

alter table public.catalog_products add column updated_at timestamptz not null default clock_timestamp();
alter table public.catalog_products add column ever_published boolean not null default false;
alter table public.catalog_products add column images jsonb not null default '[]'::jsonb;
update public.catalog_products set ever_published = published;
alter table public.catalog_products drop constraint catalog_products_currency_check;
alter table public.catalog_products add constraint catalog_products_currency_check check (currency in ('USD', 'PKR'));

create function public.catalog_sizes_valid(value jsonb) returns boolean
language sql immutable parallel safe set search_path = '' as $$
  select case when pg_catalog.jsonb_typeof(value) <> 'array' then false else
    pg_catalog.jsonb_array_length(value) between 1 and 24
    and not exists (
      select 1 from pg_catalog.jsonb_array_elements(value) as s
      where pg_catalog.jsonb_typeof(s) <> 'object'
         or pg_catalog.jsonb_typeof(s->'code') is distinct from 'string'
         or length(trim(s->>'code')) not between 1 and 16
         or pg_catalog.jsonb_typeof(s->'stock') is distinct from 'number'
         or not coalesce((s->>'stock') ~ '^(100|[1-9]?[0-9])$', false)
    )
    and (select count(*) = count(distinct lower(trim(s->>'code'))) from pg_catalog.jsonb_array_elements(value) as s)
  end
$$;
revoke all on function public.catalog_sizes_valid(jsonb) from public, anon;
grant execute on function public.catalog_sizes_valid(jsonb) to authenticated, service_role;
alter table public.catalog_products add constraint catalog_products_valid_sizes check (public.catalog_sizes_valid(sizes));
alter table public.catalog_products add constraint catalog_products_images_array check (jsonb_typeof(images) = 'array' and jsonb_array_length(images) <= 6);
alter table public.catalog_products add constraint catalog_products_slug_format check (length(slug) between 1 and 100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

create function public.prepare_catalog_product() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.id <> old.id then raise exception 'Product identity cannot change'; end if;
    if old.ever_published and new.slug <> old.slug then raise exception 'A published slug cannot change'; end if;
    if new.published and not old.ever_published then new.published_at := current_date;
    else new.published_at := old.published_at; end if;
    new.ever_published := old.ever_published or new.published;
  else
    new.ever_published := new.published;
    new.published_at := current_date;
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function public.prepare_catalog_product() from public, anon, authenticated;
create trigger prepare_catalog_product before insert or update on public.catalog_products
  for each row execute function public.prepare_catalog_product();

grant insert, update on public.catalog_products to authenticated;
create policy "Owner reads drafts" on public.catalog_products for select to authenticated
  using ((select exists(select 1 from public.store_owners where user_id = (select auth.uid()))));
create policy "Owner creates products" on public.catalog_products for insert to authenticated
  with check ((select exists(select 1 from public.store_owners where user_id = (select auth.uid()))));
create policy "Owner updates products" on public.catalog_products for update to authenticated
  using ((select exists(select 1 from public.store_owners where user_id = (select auth.uid()))))
  with check ((select exists(select 1 from public.store_owners where user_id = (select auth.uid()))));
-- No authenticated membership writes or product DELETE privileges.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog-media', 'catalog-media', true, 4194304, array['image/webp'])
on conflict (id) do nothing;
create policy "Owner uploads catalog photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'catalog-media'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and (select exists(select 1 from public.store_owners where user_id = (select auth.uid()))));
create policy "Public catalog photo metadata" on storage.objects for select to anon, authenticated
  using (bucket_id = 'catalog-media');
commit;
