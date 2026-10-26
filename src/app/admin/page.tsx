import Link from "next/link";
import { ownerPage } from "@/lib/admin-server";
export default async function AdminHome() {
  const { session } = await ownerPage();
  if (!session) return null;
  const [published, drafts, all] = await Promise.all([
    session.client
      .from("catalog_products")
      .select("id", { count: "exact", head: true })
      .eq("published", true),
    session.client
      .from("catalog_products")
      .select("id", { count: "exact", head: true })
      .eq("published", false),
    session.client
      .from("catalog_products")
      .select("id,sizes")
      .order("id")
      .range(0, 999),
  ]);
  const failed = published.error || drafts.error || all.error;
  const emptySizes = (all.data ?? []).reduce(
    (count, row) =>
      count +
      (Array.isArray(row.sizes)
        ? row.sizes.filter((size: { stock: number }) => size.stock === 0).length
        : 0),
    0,
  );
  return (
    <main id="main" className="admin-main">
      <header className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Your store</p>
          <h1>Ready when you are.</h1>
          <p>Prepare your products now. The brand and first drop can follow.</p>
        </div>
        <Link href="/admin/products/new" className="admin-primary">
          Add a product
        </Link>
      </header>
      {failed ? (
        <p role="alert" className="admin-message">
          Product counts could not load. Reload this page to retry.
        </p>
      ) : (
        <dl className="admin-metrics">
          <div>
            <dt>Published products</dt>
            <dd>{published.count ?? 0}</dd>
          </div>
          <div>
            <dt>Draft products</dt>
            <dd>{drafts.count ?? 0}</dd>
          </div>
          <div>
            <dt>
              Sizes with no stock
              {(all.data?.length ?? 0) === 1000
                ? " (first 1,000 products)"
                : ""}
            </dt>
            <dd>{emptySizes}</dd>
          </div>
        </dl>
      )}
      <section className="admin-intro">
        <h2>Start with the product.</h2>
        <p>
          Add photos, set a price, and keep stock for each size in one place.
          New products stay private until you publish them.
        </p>
        <Link href="/admin/products">Manage products</Link>
      </section>
      <section className="admin-launch-note">
        <h2>Before accepting orders</h2>
        <p>
          Publishing makes a product visible. To accept cash on delivery orders,
          mark real PKR products as checkout-ready and open ordering after
          stock, delivery arrangements and store policies are ready.
        </p>
        <Link href="/admin/orders">Manage orders and checkout</Link>
      </section>
    </main>
  );
}
