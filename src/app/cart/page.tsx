import { BagView } from "@/components/bag-view";
export const metadata = { title: "Your bag", robots: { index: false } };
export default function Page() {
  return <BagView />;
}
