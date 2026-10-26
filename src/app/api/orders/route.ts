import { revalidatePath } from "next/cache";
import { checkoutItems, deliveryAddress, uuid, OrderError } from "@/lib/orders";
import {
  databaseOrderError,
  orderBody,
  orderClient,
  orderFailure,
  orderColumns,
} from "@/lib/orders-server";
import { json } from "@/lib/account-http";
export async function POST(request: Request) {
  try {
    const { client, user } = await orderClient();
    const input = await orderBody(request);
    if (input.customerId !== user.id)
      throw new OrderError(
        "Your account changed. Reload checkout before continuing.",
        409,
      );
    if (!input.quote || typeof input.quote !== "object")
      throw new OrderError("Review the latest order total first.");
    const { data, error } = await client.rpc("place_cod_order", {
      p_request_id: uuid(input.requestId),
      p_items: checkoutItems(input.items),
      p_address: deliveryAddress(input.address),
      p_quote: input.quote,
    });
    if (error) databaseOrderError(error);
    revalidatePath("/", "layout");
    return json({ id: data });
  } catch (error) {
    return orderFailure(error);
  }
}
export async function GET(request: Request) {
  try {
    const { client, user } = await orderClient();
    const page = Math.max(
      1,
      Math.min(
        10000,
        Math.floor(Number(new URL(request.url).searchParams.get("page")) || 1),
      ),
    );
    const { data, count, error } = await client
      .from("store_orders")
      .select(orderColumns, { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .order("id")
      .range((page - 1) * 20, page * 20 - 1);
    if (error) databaseOrderError(error);
    return json({ orders: data, count, page });
  } catch (error) {
    return orderFailure(error);
  }
}
