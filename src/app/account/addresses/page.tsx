import { requireAccount } from "@/lib/supabase-server";
import { AddressBook } from "@/components/account-forms";
export const metadata = { title: "Saved addresses" };
export default async function Page() {
  const { client, user } = await requireAccount();
  const { data, error } = await client
    .from("customer_addresses")
    .select(
      "id,label,recipient,phone,line1,line2,city,province,postal_code,country",
    )
    .eq("user_id", user.id)
    .order("created_at");
  if (error) throw new Error("Could not load your addresses.");
  return (
    <>
      <h2>Saved addresses</h2>
      <AddressBook addresses={data || []} />
    </>
  );
}
