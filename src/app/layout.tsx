import "./orders.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "lenis/dist/lenis.css";
import "./globals.css";
const bodyFont = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff2",
      weight: "500",
    },
    {
      path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-600-normal.woff2",
      weight: "600",
    },
  ],
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: "Arial",
});
const displayFont = localFont({
  src: "../../node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2",
  weight: "700",
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: "Arial",
});
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: { default: "Stride — Find your next gear", template: "%s | Stride" },
  description:
    "Original sportswear concepts for running, training and everyday movement. Explore the Stride public demo storefront.",
  icons: { icon: "/icon.svg" },
  openGraph: {
    type: "website",
    siteName: "Stride",
    locale: "en_PK",
    title: "Stride — Find your next gear",
    description: "Original sportswear concepts and everyday essentials.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stride — Find your next gear",
    description: "Original sportswear concepts and everyday essentials.",
  },
};
export const revalidate = 60;
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body id="top" className={`${bodyFont.variable} ${displayFont.variable}`}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
