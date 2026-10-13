import { notFound } from "next/navigation";
import Image from "@/components/store-image";
import { collections } from "@/lib/catalog";
import { CatalogPage } from "@/components/catalog-page";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: collections[slug as keyof typeof collections]?.name || "Collection",
    alternates: { canonical: `/collections/${slug}` },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = collections[slug as keyof typeof collections];
  if (!collection) notFound();
  return (
    <CatalogPage title={collection.name} constraints={{ collection: slug }}>
      <section className="collection-banner">
        <Image
          src={collection.image}
          alt={`Original ${collection.name} collection campaign`}
          fill
          preload
          sizes="100vw"
        />
        <div className="tile-shade" />
        <div>
          <h2>{collection.headline}</h2>
          <p>{collection.description}</p>
        </div>
      </section>
    </CatalogPage>
  );
}
