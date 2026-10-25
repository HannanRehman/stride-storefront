import { getCatalog } from "@/lib/catalog-server";
import { StoreProvider } from "@/components/store-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SmoothScroll } from "@/components/smooth-scroll";
export const revalidate = 60;
export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const catalog = await getCatalog();
  return (
    <StoreProvider catalog={catalog}>
      <SmoothScroll />
      <Header />
      {children}
      <Footer />
    </StoreProvider>
  );
}
