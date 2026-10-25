// Disposable local PostgreSQL-compatible engine. Never connects to hosted data.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const { PGlite } = await import(
  pathToFileURL(
    resolve(".tools/db-test/node_modules/@electric-sql/pglite/dist/index.js"),
  ).href
);
const db = new PGlite();
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (bucket_id text, name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated;
    grant select,insert on storage.objects to anon,authenticated;
  `);
  for (const file of [
    "supabase/migrations/20261013213040_public_catalog.sql",
    "supabase/seed.sql",
    "supabase/migrations/20261014095017_customer_accounts.sql",
    "supabase/migrations/20261025211834_owner_products.sql",
    "supabase/migrations/20261025211936_owner_catalog_read_policy.sql",
    "supabase/tests/owner_products.sql",
    "supabase/tests/customer_accounts.sql",
  ]) {
    await db.exec(await readFile(file, "utf8"));
    console.log(`Passed: ${file}`);
  }
  console.log(
    "Owner RLS, write permissions, stock checks, stale saves, publication history and storage policies passed locally. Supabase Auth/Storage service behavior still needs activation checks.",
  );
} finally {
  await db.close();
}
