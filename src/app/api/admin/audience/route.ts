import { ownerClient } from "@/lib/admin-server";
import { orderFailure, databaseOrderError } from "@/lib/orders-server";
import { json } from "@/lib/account-http";
export async function GET(request: Request) {
  try {
    const { client } = await ownerClient();
    const p = new URL(request.url).searchParams;
    const page = Math.max(
      1,
      Math.min(10000, Math.floor(Number(p.get("page")) || 1)),
    );
    let q = client
      .from("launch_interest")
      .select(
        "id,email,status,consent_version,created_at,confirmed_at,unsubscribed_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .order("id")
      .range((page - 1) * 20, page * 20 - 1);
    if (
      ["confirmed", "unconfirmed", "unsubscribed"].includes(
        p.get("status") || "",
      )
    )
      q = q.eq("status", p.get("status"));
    const { data, count, error } = await q;
    if (error) databaseOrderError(error);
    return json({ people: data, count, page });
  } catch (e) {
    return orderFailure(e);
  }
}
