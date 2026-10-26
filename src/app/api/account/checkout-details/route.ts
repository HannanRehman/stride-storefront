import {
  orderClient,
  orderFailure,
  databaseOrderError,
} from "@/lib/orders-server";
import { json } from "@/lib/account-http";
export async function GET() {
  try {
    const { client, user } = await orderClient();
    const [profile, addresses] = await Promise.all([
      client
        .from("customer_profiles")
        .select("full_name,phone")
        .eq("user_id", user.id)
        .maybeSingle(),
      client
        .from("customer_addresses")
        .select(
          "id,label,recipient,phone,line1,line2,city,province,postal_code,country",
        )
        .eq("user_id", user.id)
        .eq("country", "PK")
        .order("created_at"),
    ]);
    if (profile.error) databaseOrderError(profile.error);
    if (addresses.error) databaseOrderError(addresses.error);
    return json({ profile: profile.data, addresses: addresses.data });
  } catch (e) {
    return orderFailure(e);
  }
}
