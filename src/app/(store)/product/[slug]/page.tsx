import { ShareLink } from "@/components/share-link";
import { publicCheckoutOpen } from "@/lib/public-checkout-server";
import { serializeStructuredData, siteBase } from "@/lib/seo";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCatalog } from "@/lib/catalog-server";
import { ProductDetail } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";
import { Rail } from "@/components/rail";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = (await getCatalog()).find((p) => p.slug === slug);
  return {
    title: product?.name || "Product not found",
    description: product?.description,
    ...(product?.testOnly ? { robots: { index: false, follow: false } } : {}),
    alternates: { canonical: `/product/${slug}` },
    openGraph: product
      ? {
          title: product.name,
          description: product.description,
          url: `/product/${slug}`,
          images: [{ url: product.image, alt: product.name }],
        }
      : undefined,
    twitter: product
      ? {
          card: "summary_large_image" as const,
          title: product.name,
          description: product.description,
          images: [product.image],
        }
      : undefined,
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const product = catalog.find((p) => p.slug === slug);
  if (!product) notFound();
  const checkoutOpen = product.orderable ? await publicCheckoutOpen() : false;
  const base = siteBase();
  const structured =
    product.orderable && !product.testOnly
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          image: new URL(product.image, base).href,
          ...(checkoutOpen
            ? {
                offers: {
                  "@type": "Offer",
                  url: new URL(`/product/${slug}`, base).href,
                  priceCurrency: product.currency,
                  price: (product.price / 100).toFixed(2),
                  availability: product.sizes.some((s) => s.stock > 0)
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                },
              }
            : {}),
        }
      : null;
  const related = catalog
    .filter(
      (p) =>
        !p.testOnly &&
        p.id !== product.id &&
        (p.audience === product.audience ||
          (product.audience === "unisex" && p.audience !== "kids")) &&
        (p.collection === product.collection ||
          p.category !== product.category),
    )
    .slice(0, 6);
  return (
    <main id="main">
      <div className="breadcrumbs section">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link
          href={
            product.audience === "unisex"
              ? `/shop/${product.category}`
              : `/${product.audience}/${product.category}`
          }
        >
          {product.subtitle.split(" ")[0]} {product.category}
        </Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>
      {structured && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeStructuredData(structured),
          }}
        />
      )}
      <ProductDetail key={product.id} product={product} />
      <div className="section product-share">
        <ShareLink title={product.name} />
      </div>
      <Rail
        title="Make it your own"
        href={`/shop/all?audience=${product.audience}`}
      >
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </Rail>
    </main>
  );
}
