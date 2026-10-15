import { authenticatedClient } from "@/lib/supabase-server";
import { body, json } from "@/lib/account-http";
export async function POST(request: Request) {
  try {
    const input = await body(request);
    const { client } = await authenticatedClient();
    const { data, error } = await client.rpc("customer_store_action", {
      action: input.action,
      payload: input.payload ?? {},
    });
    if (error?.message === "Size or quantity unavailable")
      return json(
        {
          code: "stock_limit",
          error: "That size or quantity is no longer available.",
        },
        409,
      );
    if (error?.message === "Product unavailable")
      return json(
        { code: "unavailable", error: "This product is no longer available." },
        409,
      );
    if (error)
      return json(
        {
          error:
            "Could not save your selections. Check the size and quantity, then try again.",
        },
        503,
      );
    return json(data);
  } catch {
    return json(
      {
        code: "session",
        error: "Please sign in again to save your selections.",
      },
      401,
    );
  }
}
