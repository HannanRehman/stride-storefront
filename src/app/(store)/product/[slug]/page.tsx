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
    alternates: { canonical: `/product/${slug}` },
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
  const related = catalog
    .filter(
      (p) =>
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
      <ProductDetail key={product.id} product={product} />
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
