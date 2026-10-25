import { requireAccount } from "@/lib/supabase-server";
import { ProfileForm } from "@/components/account-forms";
export const metadata = { title: "Profile" };
export default async function Page() {
  const { client, user } = await requireAccount();
  const { data, error } = await client
    .from("customer_profiles")
    .select("full_name, phone")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Could not load your profile.");
  return (
    <>
      <h2>Your details</h2>
      <p className="account-intro">A few details to make this account yours.</p>
      <ProfileForm
        name={
          data?.full_name ||
          (typeof user.user_metadata.full_name === "string"
            ? user.user_metadata.full_name.slice(0, 100)
            : "")
        }
        phone={data?.phone || ""}
        email={user.email || ""}
      />
    </>
  );
}
