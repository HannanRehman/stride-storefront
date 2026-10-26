import { ownerClient } from "@/lib/admin-server";
import { OrderError } from "@/lib/orders";
import { minorUnits } from "@/lib/admin-products";
import {
  databaseOrderError,
  orderBody,
  orderFailure,
} from "@/lib/orders-server";
import { json } from "@/lib/account-http";
export async function GET() {
  try {
    const { client } = await ownerClient();
    const { data, error } = await client
      .from("checkout_settings")
      .select("enabled,shipping_minor,updated_at")
      .eq("id", true)
      .single();
    if (error) databaseOrderError(error);
    return json({ settings: data });
  } catch (error) {
    return orderFailure(error);
  }
}
export async function PATCH(request: Request) {
  try {
    const { client } = await ownerClient();
    const input = await orderBody(request);
    const fee = minorUnits(input.shipping);
    if (
      typeof input.enabled !== "boolean" ||
      fee > 1000000 ||
      typeof input.updatedAt !== "string" ||
      input.updatedAt.length > 60 ||
      !Number.isFinite(Date.parse(input.updatedAt))
    )
      throw new OrderError(
        "Check the delivery charge and reload the saved checkout settings.",
      );
    const { error } = await client.rpc("set_checkout_settings", {
      p_enabled: input.enabled,
      p_shipping_minor: fee,
      p_updated_at: input.updatedAt,
    });
    if (error) databaseOrderError(error);
    return json({ ok: true });
  } catch (error) {
    return orderFailure(error);
  }
}
