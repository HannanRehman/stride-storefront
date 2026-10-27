import Link from "next/link";
import { requireAccount } from "@/lib/supabase-server";
export default async function Page() {
  const { client, user } = await requireAccount();
  const { data, error } = await client
    .from("customer_profiles")
    .select("full_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Could not load your account.");
  return (
    <>
      <h2>
        {data?.full_name
          ? `Hello, ${data.full_name}.`
          : "Welcome to your account."}
      </h2>
      <p className="account-intro">
        Your favorites and bag follow you across devices when you sign in. Keep
        your profile and addresses up to date here.
      </p>
      <div className="account-overview-links">
        <Link href="/product/checkout-test-set">
          <h3>Try test checkout</h3>
          <p>Place a simulated order. No payment or delivery takes place.</p>
        </Link>
        <Link href="/account/orders">
          <h3>Your orders</h3>
          <p>Track your orders and delivery details.</p>
        </Link>
        <Link href="/account/profile">
          <h3>Your details</h3>
          <p>Manage your name and phone number.</p>
        </Link>
        <Link href="/account/addresses">
          <h3>Saved addresses</h3>
          <p>Add or edit an address for later.</p>
        </Link>
        <Link href="/favorites">
          <h3>Keep your favorites close</h3>
          <p>Return to the pieces you’ve saved.</p>
        </Link>
      </div>
      <p className="form-note">
        Ordering opens when real products and delivery arrangements are ready.
        Existing orders are available under Your orders.
      </p>
    </>
  );
}
