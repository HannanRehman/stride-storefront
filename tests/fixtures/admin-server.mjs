// Isolated HTTP fixtures for owner UI/API tests. Never contact hosted Supabase.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
const owner = "b0a00000-0000-4000-8000-000000000001";
const uploaded = new Map(); let products = []; let failNextSave = false; let clock = Date.now();
const timestamp = () => new Date(++clock).toISOString();
function reset() { products = [{ id: "fixture-tee", slug: "fixture-tee", name: "Fixture tee", subtitle: "Demo clothing", audience: "unisex", category: "clothing", sport: "Lifestyle", collection: "everyday", price_minor: 2000, compare_at_minor: null, currency: "USD", image: "/images/tee.webp", images: [], color: "Navy", color_hex: "#17283b", badge: null, sizes: [{ code: "M", stock: 3 }], description: "Isolated fixture clothing.", featured_rank: 0, published_at: "2026-10-26", published: true, ever_published: true, created_at: timestamp(), updated_at: timestamp() }]; failNextSave = false; }
reset();
const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:54329");
  const chunks = []; for await (const chunk of request) chunks.push(chunk); const bytes = Buffer.concat(chunks);
  const send = (data, status = 200, headers = {}) => { response.writeHead(status, { "Content-Type": "application/json", ...headers }); response.end(request.method === "HEAD" ? undefined : JSON.stringify(data)); };
  const token = request.headers.authorization?.replace("Bearer ", "") || "";
  let uid = null; try { uid = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).sub; } catch { /* Anonymous fixture request. */ }
  if (url.pathname === "/test/reset") { reset(); return send({ ok: true }); }
  if (url.pathname === "/test/fail-next") { failNextSave = true; return send({ ok: true }); }
  if (url.pathname === "/test/change") { const product = products.find(row => row.id === url.searchParams.get("id")); if (product) product.updated_at = timestamp(); return send({ ok: true }); }
  if (url.pathname === "/auth/v1/user") return uid ? send({ id: uid, aud: "authenticated", role: "authenticated", email: uid === owner ? "owner@example.invalid" : "customer@example.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-26T00:00:00Z" }) : send({ message: "No session" }, 401);
  if (url.pathname.startsWith("/rest/v1/store_owners")) return send(uid === owner ? [{ user_id: owner }] : []);
  if (url.pathname === "/rest/v1/catalog_products") {
    if (request.method === "POST" || request.method === "PATCH") {
      if (uid !== owner) return send({ message: "Not an owner" }, 403);
      if (failNextSave) { failNextSave = false; return send({ message: "Injected failure" }, 503); }
      const values = JSON.parse(bytes.toString());
      if (request.method === "POST") {
        if (products.some(row => row.slug === values.slug)) return send({ code: "23505", message: "Duplicate slug" }, 409);
        const product = { ...values, images: values.images || [], ever_published: values.published, created_at: timestamp(), updated_at: timestamp() }; products.push(product); return send(product, 201);
      }
      const id = url.searchParams.get("id")?.slice(3); const version = url.searchParams.get("updated_at")?.slice(3);
      const row = products.find(row => row.id === id && row.updated_at === version);
      if (!row) return send(null);
      if (row.ever_published && row.slug !== values.slug) return send({ message: "A published slug cannot change" }, 409);
      Object.assign(row, values, { ever_published: row.ever_published || values.published, updated_at: timestamp() }); return send(row);
    }
    let rows = products.filter(row => uid === owner || row.published);
    for (const key of ["id", "published"]) { const value = url.searchParams.get(key); if (value?.startsWith("eq.")) rows = rows.filter(row => String(row[key]) === value.slice(3)); }
    const name = url.searchParams.get("name"); if (name) rows = rows.filter(row => row.name.toLowerCase().includes(name.replace(/^ilike\./, "").replaceAll("%", "").toLowerCase()));
    const count = rows.length; const offset = Number(url.searchParams.get("offset") || 0); const limit = Number(url.searchParams.get("limit") || 1000); rows = rows.slice(offset, offset + limit);
    return send(request.headers.accept?.includes("vnd.pgrst.object") ? rows[0] ?? null : rows, 200, { "Content-Range": `${offset}-${Math.max(offset, offset + rows.length - 1)}/${count}`, "Access-Control-Expose-Headers": "Content-Range" });
  }
  if (url.pathname.startsWith("/storage/v1/object/catalog-media/") && request.method === "POST") {
    if (uid !== owner) return send({ message: "Denied" }, 403);
    const path = url.pathname.replace("/storage/v1/object/catalog-media/", ""); uploaded.set(path, bytes); return send({ Key: `catalog-media/${path}`, Id: randomUUID() }, 200);
  }
  if (url.pathname.startsWith("/storage/v1/object/public/catalog-media/")) {
    const image = uploaded.get(url.pathname.replace("/storage/v1/object/public/catalog-media/", ""));
    if (image) { response.writeHead(200, { "Content-Type": "image/webp" }); return response.end(image); }
  }
  return send({ message: "Unknown isolated fixture request", path: url.pathname }, 404);
});
await new Promise(resolve => server.listen(54329, "127.0.0.1", resolve));
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "localhost", "--port", "3100"], { stdio: "inherit", env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "fixture-publishable-key", NEXT_PUBLIC_SITE_URL: "http://localhost:3100", STOREFRONT_TEST_MODE: "admin", AUTH_EMAIL_ENABLED: "false" } });
const stop = () => { child.kill(); server.close(); }; process.on("SIGTERM", stop); process.on("SIGINT", stop); child.on("exit", code => { server.close(); process.exit(code || 0); });
