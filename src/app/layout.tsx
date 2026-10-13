import type { Metadata } from "next";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "lenis/dist/lenis.css";
import "./globals.css";
import { getCatalog } from "@/lib/catalog-server";
import { StoreProvider } from "@/components/store-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SmoothScroll } from "@/components/smooth-scroll";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: { default: "Stride — Find your next gear", template: "%s | Stride" },
  description:
    "Original sportswear concepts for running, training and everyday movement. Explore the Stride public demo storefront.",
  icons: { icon: "/icon.svg" },
};
export const revalidate = 60;
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const catalog = await getCatalog();
  return (
    <html lang="en">
      <body id="top">
        <SmoothScroll />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <StoreProvider catalog={catalog}>
          <Header />
          {children}
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
