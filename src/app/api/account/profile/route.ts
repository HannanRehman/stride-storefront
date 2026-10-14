import { authenticatedClient } from "@/lib/supabase-server";
import { body, json } from "@/lib/account-http";
import { textField } from "@/lib/account-validation";
export async function POST(request: Request) {
  try {
    const input = await body(request);
    const { client, user } = await authenticatedClient();
    const full_name = textField(input.full_name, "Name", 1, 100);
    const phone = textField(input.phone ?? "", "Phone", 0, 30);
    if (phone && !/^[+\d()\s-]+$/.test(phone))
      throw new Error("Enter a valid phone number.");
    const { error } = await client
      .from("customer_profiles")
      .upsert({ user_id: user.id, full_name, phone });
    if (error)
      return json({ error: "Could not save your profile. Try again." }, 503);
    return json({ ok: true });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save your profile.",
      },
      400,
    );
  }
}
