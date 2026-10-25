import type { MetadataRoute } from "next";
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
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/auth",
        "/api",
        "/*?*",
      ],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/sitemap.xml`,
  };
}
