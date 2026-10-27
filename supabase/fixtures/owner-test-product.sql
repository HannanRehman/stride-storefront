-- Intentional demo listing; any signed-in customer can place a test order.
-- Separate from the real product preview. No genuine merchandise/stock is changed.
insert into public.catalog_products (
  id,slug,name,subtitle,audience,category,sport,collection,price_minor,currency,
  image,images,color,color_hex,badge,sizes,description,featured_rank,published_at,
  published,orderable,test_only
) values (
  'checkout-test-set','checkout-test-set','Checkout Test Set','Hoodie and trouser · test only',
  'unisex','clothing','Lifestyle','everyday',700000,'PKR',
  '/images/products/navy-hoodie-trouser-set.webp',
  '[{"src":"/images/products/navy-hoodie-trouser-set.webp","alt":"Navy hoodie and trouser set used for checkout testing","label":"Full set"},{"src":"/images/products/navy-hoodie.webp","alt":"Navy hoodie test product photo","label":"Hoodie"},{"src":"/images/products/navy-trouser.webp","alt":"Navy trouser test product photo","label":"Trouser"}]',
  'Deep navy','#17283b','Test only',
  '[{"code":"S","stock":50},{"code":"M","stock":50},{"code":"L","stock":50},{"code":"XL","stock":50}]',
  'Checkout rehearsal using a hoodie and trouser set. Sign in with any store account to try it. PKR 7,000 is a test price and all stock is simulated. No parcel will be dispatched, no payment collected and no order email sent. Use dummy delivery details. Public sales remain closed until launch.',
  -2,current_date,true,true,true
) on conflict (id) do nothing;
