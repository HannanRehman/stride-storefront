import { notFound } from "next/navigation";
import { CatalogPage } from "@/components/catalog-page";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ audience: string; category: string }>;
}) {
  const { audience, category } = await params;
  return {
    title: `${audience === "kids" ? "Kids'" : audience === "men" ? "Men's" : "Women's"} ${category}`,
    alternates: { canonical: `/${audience}/${category}` },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ audience: string; category: string }>;
}) {
  const { audience, category } = await params;
  if (
    !["men", "women", "kids"].includes(audience) ||
    !["shoes", "clothing", "accessories"].includes(category)
  )
    notFound();
  return (
    <CatalogPage
      title={`${audience === "kids" ? "Kids'" : audience === "men" ? "Men's" : "Women's"} ${category}`}
      constraints={{ audience, category }}
    />
  );
}
