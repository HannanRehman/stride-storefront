-- One SELECT policy per role avoids repeated permissive-policy evaluation.
begin;
alter policy "Read published catalog" on public.catalog_products to anon;
drop policy "Owner reads drafts" on public.catalog_products;
create policy "Read owner or published catalog" on public.catalog_products for select to authenticated
  using (published or (select exists(select 1 from public.store_owners where user_id = (select auth.uid()))));
commit;
