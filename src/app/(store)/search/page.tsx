import { CatalogPage } from "@/components/catalog-page";
export const metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.slice(0, 100).trim() : "";
  return (
    <CatalogPage title={query ? `Results for “${query}”` : "Explore Stride"} />
  );
}
