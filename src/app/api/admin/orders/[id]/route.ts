import { revalidatePath } from "next/cache";
import { ownerClient } from "@/lib/admin-server";
import { uuid, OrderError, orderStatuses } from "@/lib/orders";
import {
  databaseOrderError,
  orderBody,
  orderFailure,
  orderColumns,
} from "@/lib/orders-server";
import { json } from "@/lib/account-http";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { client } = await ownerClient();
    const id = uuid((await params).id);
    const { data, error } = await client
      .from("store_orders")
      .select(orderColumns)
      .eq("id", id)
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
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { client } = await ownerClient();
    const id = uuid((await params).id);
    const input = await orderBody(request);
    if (
      !orderStatuses.includes(input.status as (typeof orderStatuses)[number]) ||
      typeof input.updatedAt !== "string" ||
      !Number.isFinite(Date.parse(input.updatedAt)) ||
      input.updatedAt.length > 60
    )
      throw new OrderError("Reload the order and choose a valid status.");
    if (
      typeof input.courier !== "string" ||
      input.courier.length > 80 ||
      typeof input.tracking !== "string" ||
      input.tracking.length > 120
    )
      throw new OrderError("Check the courier name and tracking reference.");
    const { data, error } = await client.rpc("update_cod_order", {
      p_id: id,
      p_updated_at: input.updatedAt,
      p_status: input.status,
      p_courier: input.courier,
      p_tracking: input.tracking,
    });
    if (error) databaseOrderError(error);
    revalidatePath("/", "layout");
    return json({ id: data });
  } catch (error) {
    return orderFailure(error);
  }
}
