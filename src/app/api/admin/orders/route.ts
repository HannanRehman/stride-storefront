import { ownerClient } from "@/lib/admin-server";
import { orderStatuses } from "@/lib/orders";
import {
  databaseOrderError,
  orderFailure,
  orderColumns,
} from "@/lib/orders-server";
import { json } from "@/lib/account-http";
export async function GET(request: Request) {
  try {
    const { client } = await ownerClient();
    const params = new URL(request.url).searchParams;
    const page = Math.max(
      1,
      Math.min(10000, Math.floor(Number(params.get("page")) || 1)),
    );
    let query = client
      .from("store_orders")
      .select(orderColumns, { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id")
      .range((page - 1) * 20, page * 20 - 1);
    const status = params.get("status");
    if (orderStatuses.includes(status as (typeof orderStatuses)[number]))
      query = query.eq("status", status);
    const { data, count, error } = await query;
    if (error) databaseOrderError(error);
    return json({ orders: data, count, page });
  } catch (error) {
    return orderFailure(error);
  }
}
