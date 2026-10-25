import { notFound } from "next/navigation";
import Image from "@/components/store-image";
import Link from "next/link";
import { CatalogPage } from "@/components/catalog-page";
import { Button } from "@/components/ui/button";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ audience: string }>;
}) {
  const { audience } = await params;
  return {
    title: audience[0].toUpperCase() + audience.slice(1),
    alternates: { canonical: `/${audience}` },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ audience: string }>;
}) {
  const { audience } = await params;
  if (!["men", "women", "kids"].includes(audience)) notFound();
  return (
    <CatalogPage
      title={
        audience === "kids"
          ? "Kids"
          : `${audience === "men" ? "Men" : "Women"}'s collection`
      }
      constraints={{ audience }}
    >
      <section className="audience-hero">
        <Image
          src={
            audience === "men"
              ? "/images/court.webp"
              : audience === "women"
                ? "/images/hero.webp"
                : "/images/training.webp"
          }
          alt="Original Stride movement campaign"
          fill
          sizes="100vw"
          preload
        />
        <div className="tile-shade" />
        <div>
          <h2>
            {audience === "kids"
              ? "BIG DAYS.\nSMALL STRIDES."
              : "MAKE IT\nYOUR OWN."}
          </h2>
          <Button asChild variant="secondary">
            <Link href={`/${audience}/shoes`}>Shop shoes</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/${audience}/clothing`}>Shop clothing</Link>
          </Button>
        </div>
      </section>
    </CatalogPage>
  );
}
