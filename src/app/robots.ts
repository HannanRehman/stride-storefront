import type { MetadataRoute } from "next";
import { siteBase } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/cart",
        "/favorites",
        "/search",
        "/account",
        "/admin",
        "/checkout",
        "/api/orders",
        "/launch/preferences",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/auth",
        "/api",
        "/*?*",
      ],
    },
    sitemap: `${siteBase()}/sitemap.xml`,
  };
}
