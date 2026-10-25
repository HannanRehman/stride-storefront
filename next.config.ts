import type { NextConfig } from "next";
const project = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;
const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  images: {
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
