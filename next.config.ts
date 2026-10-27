import type { NextConfig } from "next";
const project = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;
const config: NextConfig = {
  // Keep disposable browser fixtures separate from an owner's running preview.
  distDir: ["checkout", "admin"].includes(
    process.env.STOREFRONT_TEST_MODE || "",
  )
    ? `.tools/next-${process.env.STOREFRONT_TEST_MODE}`
    : undefined,
  poweredByHeader: false,
  devIndicators: false,
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'",
          },
        ],
      },
      {
        source: "/launch/preferences",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
  images: {
    qualities: [70, 75],
    deviceSizes: [480, 640, 750, 828, 1080, 1200, 1536, 1920],
    remotePatterns: project
      ? [
          {
            protocol: project.protocol === "http:" ? "http" : "https",
            hostname: project.hostname,
            port: project.port,
            pathname: "/storage/v1/object/public/catalog-media/**",
            search: "",
          },
        ]
      : [],
  },
};
export default config;
