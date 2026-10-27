import { createClient } from "@supabase/supabase-js";
import {
  orderBody,
  orderFailure,
  databaseOrderError,
} from "@/lib/orders-server";
import { OrderError, uuid } from "@/lib/orders";
import { json } from "@/lib/account-http";
import { sharedLimit, SecurityError } from "@/lib/security-server";
export async function POST(request: Request) {
  try {
    const input = await orderBody(request);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
      key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key)
      throw new OrderError("Launch signup is not active yet.", 503);
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    if (input.action === "subscribe") {
      if (
        typeof input.email !== "string" ||
        input.email.length > 254 ||
        !/^\S+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) ||
        input.consent !== true
      )
        throw new OrderError(
          "Enter your email and choose whether to receive launch updates.",
        );
      if (typeof input.website !== "string" || input.website)
        return json({ ok: true });
      await sharedLimit(request, "launch", input.email);
      const { error } = await client.rpc("register_launch_interest", {
        p_email: input.email.trim().toLowerCase(),
        p_consent: true,
      });
      if (error) databaseOrderError(error);
    } else if (input.action === "confirm" || input.action === "unsubscribe") {
      const { error } = await client.rpc(
        input.action === "confirm"
          ? "confirm_launch_interest"
          : "unsubscribe_launch_interest",
        { p_token: uuid(input.token) },
      );
      if (error) databaseOrderError(error);
    } else throw new OrderError("Choose a valid signup action.");
    return json({ ok: true });
  } catch (e) {
    if (e instanceof SecurityError) return json({ error: e.message }, e.status);
    return orderFailure(e);
  }
}
