import { uuid, OrderError } from "@/lib/orders";
import {
  databaseOrderError,
  orderClient,
  orderFailure,
  orderColumns,
} from "@/lib/orders-server";
import { json } from "@/lib/account-http";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { client, user } = await orderClient();
    const id = uuid((await params).id);
    const { data, error } = await client
      .from("store_orders")
      .select(orderColumns)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) databaseOrderError(error);
    if (!data) throw new OrderError("Order not found.", 404);
    const events = await client
      .from("order_events")
      .select("id,status,created_at")
      .eq("order_id", id)
      .order("created_at")
      .order("id");
    if (events.error) databaseOrderError(events.error);
    return json({ order: data, events: events.data });
  } catch (error) {
    return orderFailure(error);
  }
}
