// Real disposable SQL + a minimal local Auth/PostgREST transport. Never uses hosted credentials.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const { PGlite } = await import(
  pathToFileURL(
    resolve(".tools/db-test/node_modules/@electric-sql/pglite/dist/index.js"),
  ).href
);
const db = new PGlite();
const owner = "c0d00000-0000-4000-8000-000000000001",
  customer = "c0d00000-0000-4000-8000-000000000002",
  other = "c0d00000-0000-4000-8000-000000000003";
await db.exec(`create role anon; create role authenticated; create role service_role;
create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
grant usage on schema auth,public to anon,authenticated,service_role;
create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(bucket_id text,name text);alter table storage.objects enable row level security;
grant usage on schema storage to anon,authenticated;grant select,insert on storage.objects to anon,authenticated;`);
for (const file of [
  "20261013213040_public_catalog.sql",
  "20261014095017_customer_accounts.sql",
  "20261025211834_owner_products.sql",
  "20261025211936_owner_catalog_read_policy.sql",
  "20261026225242_checkout_orders.sql",
  "20261026225251_store_operations.sql",
  "20261026225739_private_rpc_implementations.sql",
  "20261027122354_owner_test_orders.sql",
  "20261027124731_signed_in_test_orders.sql",
  "20261027140044_security_hardening.sql",
])
  await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
await db.query("insert into auth.users(id) values($1),($2),($3)", [
  owner,
  customer,
  other,
]);
await db.query("insert into public.store_owners values($1,now())", [owner]);
let failAfterCommit = false,
  failSupport = false;
let fixturePassword = "fixture-password-123";
let mfaFactor = null;
const authUser = (uid) => ({
  id: uid,
  aud: "authenticated",
  role: "authenticated",
  email: uid === owner ? "owner@example.invalid" : "customer@example.invalid",
  app_metadata: {},
  user_metadata: {},
  factors: uid === owner && mfaFactor ? [mfaFactor] : [],
  created_at: "2026-10-27T00:00:00Z",
});
function authSession(uid, aal = "aal1") {
  const payload = {
    sub: uid,
    aud: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    iss: "http://127.0.0.1:54328/auth/v1",
    role: "authenticated",
    aal,
  };
  const jwt =
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    ) +
    "." +
    Buffer.from(JSON.stringify(payload)).toString("base64url") +
    "." +
    Buffer.from("fixture").toString("base64url");
  return {
    access_token: jwt,
    refresh_token: "fixture-refresh",
    expires_in: 3600,
    expires_at: payload.exp,
    token_type: "bearer",
    user: authUser(uid),
  };
}
async function reset() {
  mfaFactor = null;
  await db.exec(
    "update public.store_owners set mfa_required=false;delete from public.security_events;delete from store_internal.rate_buckets;update store_internal.security_config set rpc_secret_hash=encode(sha256(convert_to('fixture-security-secret-not-for-production','UTF8')),'hex') where id;",
  );
  await db.exec(
    "delete from public.email_jobs;delete from public.support_messages;delete from public.support_requests;delete from public.launch_interest;delete from public.site_content_revisions;update public.site_content set draft='{}',published='{}',version=0,published_at=null;delete from public.order_events;delete from public.store_orders;delete from public.customer_bag;delete from public.customer_favorites;delete from public.customer_guest_merges;delete from public.customer_profiles;delete from public.customer_addresses;delete from public.catalog_products;",
  );
  await db.exec(`insert into public.catalog_products(id,slug,name,subtitle,audience,category,sport,collection,price_minor,currency,image,color,color_hex,sizes,description,featured_rank,published_at,published,orderable)
  values('checkout-hoodie','checkout-hoodie','Navy checkout hoodie','Everyday hoodie','unisex','clothing','Lifestyle','everyday',700000,'PKR','/images/tee.webp','Navy','#17283b','[{"code":"M","stock":3},{"code":"L","stock":2}]','Local checkout test',0,current_date,true,true),
  ('demo-tee','demo-tee','Demo tee','Concept','unisex','clothing','Lifestyle','everyday',2000,'USD','/images/tee.webp','Black','#111111','[{"code":"M","stock":3}]','Not for checkout',1,current_date,true,false);
  update public.checkout_settings set enabled=true,shipping_minor=25000,updated_at=clock_timestamp();`);
  await db.query(
    "insert into public.customer_bag values($1,'checkout-hoodie','M',1)",
    [customer],
  );
  failAfterCommit = false;
  failSupport = false;
  fixturePassword = "fixture-password-123";
}
await reset();
const rpc = {
  consume_security_limit: ["p_action", "p_identity", "p_ip", "p_secret"],
  enable_owner_mfa: [],
  quote_cod_order: ["p_items"],
  place_cod_order: ["p_request_id", "p_items", "p_address", "p_quote"],
  update_cod_order: [
    "p_id",
    "p_updated_at",
    "p_status",
    "p_courier",
    "p_tracking",
  ],
  set_checkout_settings: ["p_enabled", "p_shipping_minor", "p_updated_at"],
  customer_store_action: ["action", "payload"],
  read_site_content: [],
  save_site_content: ["p_document", "p_version"],
  publish_site_content: ["p_version"],
  restore_site_content: ["p_revision", "p_version"],
  open_support_request: [
    "p_key",
    "p_kind",
    "p_subject",
    "p_message",
    "p_order",
  ],
  reply_support_request: ["p_id", "p_key", "p_body"],
  set_support_status: ["p_id", "p_status", "p_updated_at"],
  register_launch_interest: ["p_email", "p_consent"],
  confirm_launch_interest: ["p_token"],
  unsubscribe_launch_interest: ["p_token"],
};
const tables = new Set([
  "security_events",
  "catalog_products",
  "store_orders",
  "order_events",
  "checkout_settings",
  "store_owners",
  "customer_profiles",
  "customer_addresses",
  "site_content",
  "site_content_revisions",
  "support_requests",
  "support_messages",
  "launch_interest",
  "email_jobs",
]);
const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:54328");
  const chunks = [];
  for await (const c of request) chunks.push(c);
  const send = (value, status = 200, headers = {}) => {
    response.writeHead(status, {
      "Content-Type": "application/json",
      ...headers,
    });
    response.end(request.method === "HEAD" ? undefined : JSON.stringify(value));
  };
  try {
    if (url.pathname === "/test/reset") {
      await reset();
      return send({ ok: true });
    }
    if (url.pathname === "/test/owner-test-order") {
      await db.exec(
        await readFile("supabase/fixtures/owner-test-product.sql", "utf8"),
      );
      await db.exec(
        "update public.checkout_settings set enabled=false;delete from public.customer_bag;",
      );
      return send({ ok: true });
    }
    if (url.pathname === "/test/pagination") {
      // Historical records for read/pagination assertions only, never hosted.
      await db.exec(`
        insert into public.store_orders(user_id,request_id,request_fingerprint,items,address,subtotal_minor,shipping_minor,total_minor,is_test,created_at)
        select '${customer}',gen_random_uuid(),'fixture-'||g,
          '[{"productId":"checkout-hoodie","slug":"checkout-hoodie","name":"Pagination test set","color":"Navy","size":"M","quantity":1,"unit_minor":700000,"line_minor":700000}]'::jsonb,
          '{"recipient":"Test Customer","phone":"03001234567","line1":"Test Street","line2":"","city":"Lahore","province":"Punjab","postal_code":"","country":"PK"}'::jsonb,
          700000,25000,725000,true,now()-g*interval '1 minute' from generate_series(1,21) g;
        insert into public.support_requests(user_id,request_key,kind,subject,created_at)
          select '${customer}',gen_random_uuid(),'question','Audit request '||lpad(g::text,2,'0'),now()-g*interval '1 minute' from generate_series(1,21) g;
        insert into public.support_messages(request_id,client_key,author_role,body,created_at)
          select (select id from public.support_requests order by subject limit 1),gen_random_uuid(),'customer','Message '||g,now()-g*interval '1 minute' from generate_series(1,51) g;
        insert into public.launch_interest(email,status,created_at)
          select 'audit-'||g||'@example.invalid',case when g%2=0 then 'confirmed' else 'unconfirmed' end,now()-g*interval '1 minute' from generate_series(1,21) g;
      `);
      return send({ ok: true });
    }
    if (url.pathname === "/test/operations")
      return send({
        audience: (await db.query("select * from public.launch_interest")).rows,
      });
    if (url.pathname === "/test/empty-bag") {
      await db.exec("delete from public.customer_bag");
      return send({ ok: true });
    }
    if (url.pathname === "/test/fail-support") {
      failSupport = true;
      return send({ ok: true });
    }
    if (url.pathname === "/test/fail-after-commit") {
      failAfterCommit = true;
      return send({ ok: true });
    }
    if (url.pathname === "/test/close") {
      await db.exec(
        "update public.checkout_settings set enabled=false,updated_at=clock_timestamp()",
      );
      return send({ ok: true });
    }
    if (url.pathname === "/test/price") {
      await db.exec(
        "update public.catalog_products set price_minor=710000 where id='checkout-hoodie'",
      );
      return send({ ok: true });
    }
    if (url.pathname === "/test/last-unit") {
      await db.exec(
        'update public.catalog_products set sizes=\'[{"code":"M","stock":1}]\'::jsonb where id=\'checkout-hoodie\'',
      );
      return send({ ok: true });
    }
    if (url.pathname === "/test/state") {
      return send({
        orders: (
          await db.query("select id,status,items from public.store_orders")
        ).rows,
        products: (
          await db.query("select id,sizes from public.catalog_products")
        ).rows,
      });
    }
    let uid = null,
      claims = {};
    try {
      claims = JSON.parse(
        Buffer.from(
          request.headers.authorization?.replace("Bearer ", "").split(".")[1] ||
            "",
          "base64url",
        ).toString(),
      );
      uid = claims.sub;
    } catch {
      /* Anonymous fixture. */
    }
    if (![owner, customer, other].includes(uid)) uid = null;
    if (url.pathname === "/auth/v1/factors" && request.method === "POST") {
      if (uid !== owner) return send({ message: "Not owner" }, 403);
      mfaFactor = {
        id: "5ec00000-0000-4000-8000-000000000010",
        friendly_name: "Fixture authenticator",
        factor_type: "totp",
        status: "unverified",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return send({
        id: mfaFactor.id,
        type: "totp",
        totp: {
          qr_code:
            '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect width="220" height="220" fill="white"/><text x="20" y="110">Fixture QR</text></svg>',
          secret: "FIXTURESETUPKEY",
          uri: "otpauth://totp/Fixture?secret=FIXTURESETUPKEY",
        },
      });
    }
    if (url.pathname.startsWith("/auth/v1/factors/")) {
      if (uid !== owner || !mfaFactor)
        return send({ message: "Unknown factor" }, 400);
      if (request.method === "DELETE") {
        mfaFactor = null;
        return send({ id: "removed" });
      }
      if (url.pathname.endsWith("/challenge"))
        return send({
          id: "5ec00000-0000-4000-8000-000000000011",
          type: "totp",
          expires_at: Math.floor(Date.now() / 1000) + 60,
        });
      if (url.pathname.endsWith("/verify")) {
        const input = JSON.parse(Buffer.concat(chunks).toString());
        if (input.code !== "123456")
          return send({ message: "Invalid fixture code" }, 400);
        mfaFactor.status = "verified";
        return send(authSession(owner, "aal2"));
      }
    }

    if (url.pathname === "/auth/v1/token") {
      const input = JSON.parse(Buffer.concat(chunks).toString());
      if (url.searchParams.get("grant_type") === "pkce")
        return input.auth_code === "fixture-recovery-code" &&
          input.code_verifier
          ? send(authSession(customer))
          : send(
              {
                error: "invalid_grant",
                error_description: "Invalid fixture code",
              },
              400,
            );
      if (
        input.email === "owner@example.invalid" &&
        input.password === "fixture-owner-password-123"
      )
        return send(authSession(owner));
      if (
        input.email === "customer@example.invalid" &&
        input.password === fixturePassword
      )
        return send(authSession(customer));
      return send(
        {
          error: "invalid_grant",
          error_description: "Invalid fixture credentials",
        },
        400,
      );
    }
    if (url.pathname === "/auth/v1/signup")
      return send({ user: authUser(other), session: null });
    if (url.pathname === "/auth/v1/recover") return send({});
    if (url.pathname === "/auth/v1/logout") return send(undefined, 204);
    if (url.pathname === "/auth/v1/user" && request.method === "PUT") {
      if (!uid) return send({ message: "No session" }, 401);
      const input = JSON.parse(Buffer.concat(chunks).toString());
      fixturePassword = input.password;
      return send(authUser(uid));
    }
    if (url.pathname === "/auth/v1/user")
      return uid ? send(authUser(uid)) : send({ message: "No session" }, 401);
    let operation = url.pathname.split("/").pop();
    const isRpc = url.pathname.startsWith("/rest/v1/rpc/");
    if (
      !url.pathname.startsWith("/rest/v1/") ||
      (!isRpc && !tables.has(operation)) ||
      (isRpc && !rpc[operation])
    )
      return send({ message: "Unknown fixture resource" }, 404);
    const result = await db.transaction(async (tx) => {
      await tx.exec(`set local role ${uid ? "authenticated" : "anon"}`);
      await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [
        uid || "",
      ]);
      await tx.query("select set_config('request.jwt.claims',$1,true)", [
        JSON.stringify(claims),
      ]);
      if (isRpc) {
        const body = JSON.parse(Buffer.concat(chunks).toString());
        const names = rpc[operation];
        const args = names.map((n) =>
          body[n] !== null && typeof body[n] === "object"
            ? JSON.stringify(body[n])
            : body[n],
        );
        return {
          data: (
            await tx.query(
              `select public.${operation}(${names.map((_, i) => `$${i + 1}`).join(",")}) as value`,
              args,
            )
          ).rows[0].value,
        };
      }
      const values = [];
      const filters = [];
      for (const [key, value] of url.searchParams) {
        if (
          [
            "id",
            "user_id",
            "order_id",
            "request_id",
            "status",
            "published",
          ].includes(key) &&
          value.startsWith("eq.")
        ) {
          values.push(value.slice(3));
          filters.push(`${key} = $${values.length}`);
        }
      }
      if (
        ["customer_profiles", "customer_addresses"].includes(operation) &&
        ["POST", "PATCH", "DELETE"].includes(request.method)
      ) {
        if (request.method === "DELETE") {
          const where = filters.length ? " where " + filters.join(" and ") : "";
          return {
            data: (
              await tx.query(
                "delete from public." + operation + where + " returning id",
                values,
              )
            ).rows,
          };
        }
        const input = JSON.parse(Buffer.concat(chunks).toString());
        const keys = Object.keys(input);
        const allowed =
          operation === "customer_profiles"
            ? ["user_id", "full_name", "phone"]
            : [
                "user_id",
                "label",
                "recipient",
                "phone",
                "line1",
                "line2",
                "city",
                "province",
                "postal_code",
                "country",
              ];
        if (keys.some((k) => !allowed.includes(k)))
          throw new Error("Unsupported fixture fields");
        if (request.method === "POST") {
          const upsert =
            operation === "customer_profiles"
              ? " on conflict(user_id) do update set full_name=excluded.full_name,phone=excluded.phone"
              : "";
          return {
            data: (
              await tx.query(
                "insert into public." +
                  operation +
                  "(" +
                  keys.join(",") +
                  ") values(" +
                  keys.map((_, i) => "$" + (i + 1)).join(",") +
                  ")" +
                  upsert +
                  " returning *",
                keys.map((k) => input[k]),
              )
            ).rows,
          };
        }
        const clauses = keys.map(
          (key, i) => key + "=$" + (values.length + i + 1),
        );
        return {
          data: (
            await tx.query(
              "update public." +
                operation +
                " set " +
                clauses.join(",") +
                (filters.length ? " where " + filters.join(" and ") : "") +
                " returning id",
              [...values, ...keys.map((k) => input[k])],
            )
          ).rows,
        };
      }
      const where = filters.length ? ` where ${filters.join(" and ")}` : "";
      const count = Number(
        (
          await tx.query(
            `select count(*) as total from public.${operation}${where}`,
            values,
          )
        ).rows[0].total,
      );
      const order = url.searchParams.get("order") || "";
      let sort = "";
      if (order) {
        const entries = order.split(",").map((s) => s.split("."));
        if (
          entries.every(([k]) =>
            ["created_at", "id", "featured_rank"].includes(k),
          )
        )
          sort = ` order by ${entries.map(([k, d]) => `${k} ${d === "desc" ? "desc" : "asc"}`).join(",")}`;
      }
      const limit = Math.min(
          1000,
          Math.max(1, Number(url.searchParams.get("limit")) || 1000),
        ),
        offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
      const selection = url.searchParams.get("select") || "*";
      if (!/^[a-z0-9_,*]+$/.test(selection))
        throw new Error("Unsupported fixture selection");
      const rows = (
        await tx.query(
          `select ${selection}${["store_orders", "catalog_products", "checkout_settings", "support_requests"].includes(operation) && (selection === "*" || selection.includes("updated_at")) ? ", updated_at::text as updated_at" : ""} from public.${operation}${where}${sort} limit ${limit} offset ${offset}`,
          values,
        )
      ).rows;
      return {
        data: request.headers.accept?.includes("vnd.pgrst.object")
          ? rows[0] || null
          : rows,
        count,
      };
    });
    if (operation === "open_support_request" && failSupport) {
      failSupport = false;
      return send({ message: "Lost support response after commit" }, 503);
    }
    if (operation === "place_cod_order" && failAfterCommit) {
      failAfterCommit = false;
      return send({ message: "Lost response after committed order" }, 503);
    }
    return send(
      result.data,
      200,
      result.count === undefined
        ? {}
        : {
            "Content-Range": `0-${Math.max(0, result.count - 1)}/${result.count}`,
          },
    );
  } catch (e) {
    return send({ message: e.message, code: e.code || "P0001" }, 400);
  }
});
await new Promise((resolve) => server.listen(54328, "127.0.0.1", resolve));
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "localhost",
    "--port",
    "3101",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54328",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "fixture-key",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3101",
      AUTH_EMAIL_ENABLED: "true",
      STOREFRONT_TEST_MODE: "checkout",
      SECURITY_RPC_SECRET: "fixture-security-secret-not-for-production",
    },
  },
);
const stop = () => {
  child.kill();
  server.close();
  void db.close();
};
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
child.on("exit", (code) => {
  server.close();
  void db.close();
  process.exit(code || 0);
});
