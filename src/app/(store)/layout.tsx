import { getCatalog } from "@/lib/catalog-server";
import { StoreProvider } from "@/components/store-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { getSiteContent } from "@/lib/site-content-server";
export const revalidate = 60;
export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [catalog, content] = await Promise.all([
    getCatalog(),
    getSiteContent(),
  ]);
  return (
    <StoreProvider catalog={catalog}>
      <SmoothScroll />
      <Header
        announcement={content.announcement}
        announcementHref={content.announcementHref}
      />
      {children}
      <Footer launchEnabled={content.launchEnabled} />
    </StoreProvider>
  );
}
