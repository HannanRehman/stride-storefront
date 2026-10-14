import { authenticatedClient } from "@/lib/supabase-server";
import { body, json } from "@/lib/account-http";
import { addressFields } from "@/lib/account-validation";
export async function POST(request: Request) {
  try {
    const input = await body(request);
    const { client, user } = await authenticatedClient();
    if (
      input.id &&
      (typeof input.id !== "string" || !/^[\da-f-]{36}$/i.test(input.id))
    )
      throw new Error("Invalid address.");
    if (input.action === "delete") {
      const { data, error } = await client
        .from("customer_addresses")
        .delete()
        .eq("user_id", user.id)
        .eq("id", input.id)
        .select("id");
      if (error || !data?.length)
        return json(
          { error: "Address not found or could not be removed." },
          400,
        );
    } else {
      const values = addressFields(input);
      const query = input.id
        ? client
            .from("customer_addresses")
            .update(values)
            .eq("user_id", user.id)
            .eq("id", input.id)
        : client
            .from("customer_addresses")
            .insert({ ...values, user_id: user.id });
      const { data, error } = await query.select("id");
      if (error || !data?.length)
        return json({ error: "Address could not be saved. Try again." }, 400);
    }
    return json({ ok: true });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save your address.",
      },
      400,
    );
  }
}
