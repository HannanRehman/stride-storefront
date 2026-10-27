// Restore a disposable database snapshot. Never exports or restores hosted data.
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const { PGlite } = await import(
  pathToFileURL(
    resolve(".tools/db-test/node_modules/@electric-sql/pglite/dist/index.js"),
  ).href
);
const source = new PGlite();
let restored;
try {
  await source.exec(`create role anon;create role authenticated;create role service_role;
    create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    grant usage on schema auth,public to anon,authenticated,service_role;
    create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(bucket_id text,name text);alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated;grant select,insert on storage.objects to anon,authenticated;`);
  for (const file of (await readdir("supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await source.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
  await source.exec(await readFile("supabase/seed.sql", "utf8"));
  await source.exec(
    await readFile("supabase/fixtures/owner-test-product.sql", "utf8"),
  );
  const uid = "9ac00000-0000-4000-8000-000000000001";
  await source.exec(`insert into auth.users(id) values('${uid}');insert into public.store_owners(user_id) values('${uid}');
    begin;set local role authenticated;select set_config('request.jwt.claim.sub','${uid}',true);
    select public.place_cod_order(gen_random_uuid(),'[{"productId":"checkout-test-set","size":"M","quantity":1}]',
      '{"recipient":"Restore Fixture","phone":"03001234567","line1":"Test Street","city":"Lahore","province":"Punjab","country":"PK"}',
      public.quote_cod_order('[{"productId":"checkout-test-set","size":"M","quantity":1}]'));commit;`);
  const snapshot = async (db) => ({
    orders: (
      await db.query(
        "select id,items,address,total_minor,is_test from public.store_orders order by id",
      )
    ).rows,
    stock: (
      await db.query(
        "select sizes from public.catalog_products where id='checkout-test-set'",
      )
    ).rows,
    events: (
      await db.query(
        "select order_id,status from public.order_events order by id",
      )
    ).rows,
    owners: (
      await db.query(
        "select user_id,mfa_required from public.store_owners order by user_id",
      )
    ).rows,
    securityHistory: (
      await db.query(
        "select actor_id,kind,entity_id from public.security_events order by id",
      )
    ).rows,
  });
  const expected = await snapshot(source);
  const archive = await source.dumpDataDir("none");
  restored = new PGlite({ loadDataDir: archive });
  assert.deepEqual(await snapshot(restored), expected);
  for (const file of [
    "checkout_orders",
    "owner_test_orders",
    "store_operations",
    "owner_products",
    "customer_accounts",
    "security_hardening",
  ]) {
    // These assertions expect an otherwise empty order ledger; run them after
    // verifying and removing only this disposable restore fixture's records.
    if (file === "checkout_orders")
      await restored.exec(
        "delete from public.security_events;delete from public.order_events;delete from public.store_orders;",
      );
    await restored.exec(await readFile(`supabase/tests/${file}.sql`, "utf8"));
  }
  console.log(
    "Restore drill passed: snapshot restored into a separate disposable database; order snapshots, test marker, stock, timeline and owner membership matched; all six SQL permission/integrity suites passed after restoration. Hosted backups, real Auth and Storage files still require their own restore acceptance.",
  );
} finally {
  if (restored) await restored.close();
  await source.close();
}
