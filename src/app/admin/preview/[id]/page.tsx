import Link from "next/link";
import Image from "@/components/store-image";
import { ownerPage } from "@/lib/admin-server";
import { recordToProduct, type ProductRecord } from "@/lib/admin-products";
import { money } from "@/lib/utils";
export default async function PreviewProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { session } = await ownerPage(`/admin/preview/${id}`);
  if (!session) return null;
  const { data, error } = await session.client
    .from("catalog_products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data)
    return (
      <main id="main" className="admin-main">
        <h1>Preview unavailable</h1>
        <p>Reload the saved product and try again.</p>
      </main>
    );
  const product = recordToProduct(data as ProductRecord);
  return (
    <main id="main" className="admin-main">
      <header className="admin-page-heading">
        <div>
          <h1>Product preview</h1>
          <p>Only the owner can see this page. Preview shows saved changes.</p>
        </div>
        <Link href={`/admin/products/${id}`}>Back to editor</Link>
      </header>
      <div className="admin-preview">
        <div>
          {(product.images?.length
            ? product.images
            : [{ src: product.image, alt: product.name }]
          ).map((photo) => (
            <div key={photo.src} className="admin-preview-photo">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 700px) 90vw, 50vw"
              />
            </div>
          ))}
        </div>
        <section>
          <h2>{product.name}</h2>
          <p>{product.subtitle}</p>
          <p className="admin-preview-price">
            {money(product.price, product.currency)}
          </p>
          <p>{product.color}</p>
          <p>{product.description}</p>
          <p>
            Sizes:{" "}
            {product.sizes
              .map((size) => `${size.code} (${size.stock} in stock)`)
              .join(", ")}
          </p>
          <p>{data.published ? "Published" : "Private draft"}</p>
        </section>
      </div>
    </main>
  );
}
