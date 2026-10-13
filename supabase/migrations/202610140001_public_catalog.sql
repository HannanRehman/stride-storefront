-- Public presentation catalog only. Not a checkout inventory ledger.
create table public.catalog_products (
  id text primary key,
  slug text not null unique,
  name text not null,
  subtitle text not null,
  audience text not null check (audience in ('men', 'women', 'kids', 'unisex')),
  category text not null check (category in ('shoes', 'clothing', 'accessories')),
  sport text not null,
  collection text not null,
  price_minor integer not null check (price_minor >= 0),
  compare_at_minor integer check (compare_at_minor > price_minor),
  currency text not null default 'USD' check (currency = 'USD'),
  image text not null,
  color text not null,
  color_hex text not null,
  badge text,
  sizes jsonb not null check (jsonb_typeof(sizes) = 'array'),
  description text not null,
  featured_rank integer not null,
  published_at date not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create index catalog_products_published_rank_idx on public.catalog_products (featured_rank, id) where published = true;
create index catalog_products_audience_category_idx on public.catalog_products (audience, category) where published = true;
alter table public.catalog_products enable row level security;
revoke all on public.catalog_products from anon, authenticated;
grant select on public.catalog_products to anon, authenticated;
create policy "Read published catalog" on public.catalog_products for select to anon, authenticated using (published = true);
-- No public insert/update/delete policies or privileges.
