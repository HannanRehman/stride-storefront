import { redirect } from "next/navigation";
import { authenticatedClient } from "@/lib/supabase-server";
import { Checkout } from "@/components/checkout";
export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Page() {
  const session = await authenticatedClient().catch(() => null);
  if (!session) redirect("/login?next=/checkout");
  return <Checkout />;
}
