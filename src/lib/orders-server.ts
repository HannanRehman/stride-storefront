import "server-only";
import { accountClient } from "@/lib/supabase-server";
import { assertSameOrigin, json } from "@/lib/account-http";
import { OrderError } from "@/lib/orders";
import { AdminError } from "@/lib/admin-products";
export const orderColumns =
  "id,status,payment_status,payment_method,currency,items,address,subtotal_minor,shipping_minor,total_minor,courier,tracking_reference,created_at,updated_at";
export async function orderClient() {
  const client = await accountClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    throw new OrderError("Sign in to continue to checkout and orders.", 401);
  return { client, user: data.user };
}
export async function orderBody(request: Request) {
  try {
    assertSameOrigin(request);
    if (
      !request.headers.get("content-type")?.startsWith("application/json") ||
      !request.body
    )
      throw new Error("Invalid JSON request");
    const reader = request.body.getReader();
    const parts: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 20000) {
        await reader.cancel();
        throw new Error("Body too large");
      }
      parts.push(part.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) {
      bytes.set(part, offset);
      offset += part.length;
    }
    const input = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new Error("Invalid JSON object");
    return input as Record<string, unknown>;
  } catch {
    throw new OrderError("Send this form from the store website.");
  }
}
const errors: Record<string, [string, number]> = {
  operation_rate_limit: [
    "Too many requests were made recently. Try again later.",
    429,
  ],
  content: ["Check the campaign content and save a valid draft.", 400],
  request: ["Choose a valid request type, subject and message.", 400],
  order_status: [
    "This request type does not match the order status. Cancellation requests are for unshipped orders; returns are for delivered orders.",
    409,
  ],
  resolved: [
    "This request is resolved. Open a new request for another question.",
    409,
  ],
  email: [
    "Enter a valid email and explicit permission for launch updates.",
    400,
  ],
  launch_closed: ["Launch signup is not open yet.", 409],
  sign_in: ["Sign in to continue.", 401],
  closed: ["Ordering has not opened yet. Your bag is saved for later.", 409],
  invalid_items: [
    "Check the sizes and quantities in your bag. Up to 20 items and 10 of each size are supported.",
    400,
  ],
  unavailable: [
    "A bag item is not available for checkout. Only checkout-ready PKR products can be ordered.",
    409,
  ],
  stock: [
    "A size or quantity is no longer in stock. Update your bag and review again.",
    409,
  ],
  limit: [
    "This order exceeds the supported total. Contact the store for a larger order.",
    400,
  ],
  address: ["Check your delivery address and Pakistani mobile number.", 400],
  invalid_request: ["Reload checkout before continuing.", 400],
  request_changed: [
    "This checkout attempt already belongs to a different order. Check your orders before starting a new checkout.",
    409,
  ],
  rate_limit: [
    "Too many orders were placed recently. Check your orders and try again in an hour.",
    429,
  ],
  price_changed: [
    "Prices or delivery charges changed. Review the latest total before placing your order.",
    409,
  ],
  owner_only: ["Only a store owner can manage orders.", 403],
  not_found: ["Order not found.", 404],
  stale: [
    "This record changed in another session. Reload it before saving again.",
    409,
  ],
  transition: [
    "That status change is not allowed. Reload the order to check its current status.",
    409,
  ],
  tracking: [
    "Add the courier name and tracking reference before marking an order shipped.",
    400,
  ],
  restock: [
    "Stock could not be restored. Restore the original size and leave room below the 100-unit stock limit, then retry cancellation.",
    409,
  ],
  settings: ["Enter a delivery charge from PKR 0 to PKR 10,000.", 400],
};
export function databaseOrderError(error: {
  message: string;
  code?: string;
}): never {
  const matched = error.message.match(/(checkout|operations):([a-z_]+)/);
  const code =
    matched?.[1] === "operations" && matched?.[2] === "rate_limit"
      ? "operation_rate_limit"
      : matched?.[2];
  if (code && errors[code])
    throw new OrderError(errors[code][0], errors[code][1], code);
  throw new OrderError(
    "This store service is not activated yet or could not connect. Retry shortly.",
    503,
  );
}
export function orderFailure(error: unknown) {
  return json(
    {
      code: error instanceof OrderError ? error.code : undefined,
      error:
        error instanceof OrderError || error instanceof AdminError
          ? error.message
          : "Could not confirm the request. Check your orders before retrying.",
    },
    error instanceof OrderError || error instanceof AdminError
      ? error.status
      : 503,
  );
}
