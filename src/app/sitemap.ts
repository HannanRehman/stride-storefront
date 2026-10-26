import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog-server";
import { siteBase } from "@/lib/seo";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBase();
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
    "/contact",
    "/launch",
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
