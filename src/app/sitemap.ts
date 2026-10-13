import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog-server";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const catalog = await getCatalog();
  const routes = [
    "",
    "/new",
    "/men",
    "/women",
    "/kids",
    "/shop/all",
    "/shop/shoes",
    "/shop/clothing",
    "/shop/accessories",
    "/help",
    "/size-guide",
    "/shipping-returns",
    "/privacy",
    "/terms",
    ...["men", "women", "kids"].flatMap((a) =>
      ["shoes", "clothing"].map((c) => `/${a}/${c}`),
    ),
    ...["pace", "court", "everyday", "motion"].map((c) => `/collections/${c}`),
    ...catalog.map((p) => `/product/${p.slug}`),
  ];
  return routes.map((route) => ({ url: `${base}${route}` }));
}
