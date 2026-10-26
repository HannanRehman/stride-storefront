import { checkoutItems } from "@/lib/orders";
import {
  databaseOrderError,
  orderBody,
  orderClient,
  orderFailure,
} from "@/lib/orders-server";
import { json } from "@/lib/account-http";
export async function POST(request: Request) {
  try {
    const { client } = await orderClient();
    const input = await orderBody(request);
    const { data, error } = await client.rpc("quote_cod_order", {
      p_items: checkoutItems(input.items),
    });
    if (error) databaseOrderError(error);
    return json({ quote: data });
  } catch (error) {
    return orderFailure(error);
  }
}
