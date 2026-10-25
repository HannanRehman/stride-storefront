import { notFound } from "next/navigation";
import { CatalogPage } from "@/components/catalog-page";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return {
    title:
      category === "all"
        ? "All products"
        : category[0].toUpperCase() + category.slice(1),
    alternates: { canonical: `/shop/${category}` },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!["all", "shoes", "clothing", "accessories"].includes(category))
    notFound();
  return (
    <CatalogPage
      title={
        category === "all"
          ? "All products"
          : category[0].toUpperCase() + category.slice(1)
      }
      constraints={{ category }}
    />
  );
}
