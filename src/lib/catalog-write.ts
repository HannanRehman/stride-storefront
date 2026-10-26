import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AdminError } from "./admin-products";
// A staged deployment must keep the previously activated product editor usable.
// Missing eligibility support may only fall back when checkout remains disabled.
export async function catalogWrite(
  client: SupabaseClient,
  values: Record<string, unknown>,
  target?: { id: string; updatedAt: string },
) {
  const write = (input: Record<string, unknown>) =>
    target
      ? client
          .from("catalog_products")
          .update(input)
          .eq("id", target.id)
          .eq("updated_at", target.updatedAt)
          .select()
          .maybeSingle()
      : client.from("catalog_products").insert(input).select().single();
  let result = await write(values);
  if (
    result.error &&
    ["PGRST204", "42703"].includes(result.error.code) &&
    result.error.message.includes("orderable")
  ) {
    if (values.orderable)
      throw new AdminError(
        "Activate the checkout database migration before allowing this product to be ordered.",
        503,
      );
    const legacy = { ...values };
    delete legacy.orderable;
    result = await write(legacy);
  }
  return result;
}
