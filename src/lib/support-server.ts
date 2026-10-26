import "server-only";
import { ownerClient } from "@/lib/admin-server";
import {
  orderBody,
  orderClient,
  orderFailure,
  databaseOrderError,
} from "@/lib/orders-server";
import { OrderError, uuid } from "@/lib/orders";
import { requestKinds } from "@/lib/support";
import { json } from "@/lib/account-http";
const columns = "id,kind,subject,status,order_id,created_at,updated_at";
async function session(owner: boolean) {
  return owner ? ownerClient() : orderClient();
}
export async function listRequests(request: Request, owner = false) {
  try {
    const { client, user } = await session(owner);
    const params = new URL(request.url).searchParams;
    const page = Math.max(
      1,
      Math.min(10000, Math.floor(Number(params.get("page")) || 1)),
    );
    let query = client
      .from("support_requests")
      .select(columns, { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id")
      .range((page - 1) * 20, page * 20 - 1);
    if (!owner) query = query.eq("user_id", user.id);
    const status = params.get("status");
    if (owner && ["open", "in_progress", "resolved"].includes(status || ""))
      query = query.eq("status", status);
    const { data, count, error } = await query;
    if (error) databaseOrderError(error);
    return json({ requests: data, count, page });
  } catch (e) {
    return orderFailure(e);
  }
}
export async function openRequest(request: Request) {
  try {
    const { client, user } = await orderClient();
    const input = await orderBody(request);
    if (input.customerId !== user.id)
      throw new OrderError(
        "Your account changed. Reload this form before continuing.",
        409,
      );
    if (
      !requestKinds.includes(input.kind as (typeof requestKinds)[number]) ||
      typeof input.subject !== "string" ||
      input.subject.trim().length < 1 ||
      input.subject.trim().length > 120 ||
      typeof input.message !== "string" ||
      input.message.trim().length < 1 ||
      input.message.trim().length > 2000
    )
      throw new OrderError(
        "Choose a request type, subject and message (up to 2,000 characters).",
      );
    const { data, error } = await client.rpc("open_support_request", {
      p_key: uuid(input.requestKey),
      p_kind: input.kind,
      p_subject: input.subject.trim(),
      p_message: input.message.trim(),
      p_order: input.orderId ? uuid(input.orderId) : null,
    });
    if (error) databaseOrderError(error);
    return json({ id: data });
  } catch (e) {
    return orderFailure(e);
  }
}
export async function readRequest(
  id: string,
  owner = false,
  request?: Request,
) {
  try {
    const { client, user } = await session(owner);
    let query = client
      .from("support_requests")
      .select(columns)
      .eq("id", uuid(id));
    if (!owner) query = query.eq("user_id", user.id);
    const result = await query.maybeSingle();
    if (result.error) databaseOrderError(result.error);
    if (!result.data) throw new OrderError("Request not found.", 404);
    const page = Math.max(
      1,
      Math.min(
        10000,
        Math.floor(
          Number(request ? new URL(request.url).searchParams.get("page") : 1) ||
            1,
        ),
      ),
    );
    const messages = await client
      .from("support_messages")
      .select("id,client_key,author_role,body,created_at", { count: "exact" })
      .eq("request_id", id)
      .order("created_at", { ascending: false })
      .order("id")
      .range((page - 1) * 50, page * 50 - 1);
    if (messages.error) databaseOrderError(messages.error);
    return json({
      request: result.data,
      messages: [...(messages.data || [])].reverse(),
      messagesCount: messages.count,
      page,
    });
  } catch (e) {
    return orderFailure(e);
  }
}
export async function changeRequest(
  request: Request,
  id: string,
  owner = false,
) {
  try {
    const { client } = await session(owner);
    const input = await orderBody(request);
    uuid(id);
    let result;
    if (input.action === "reply") {
      if (
        typeof input.message !== "string" ||
        input.message.trim().length < 1 ||
        input.message.trim().length > 2000
      )
        throw new OrderError("Write a message with 1–2,000 characters.");
      result = await client.rpc("reply_support_request", {
        p_id: id,
        p_key: uuid(input.messageKey),
        p_body: input.message.trim(),
      });
    } else if (input.action === "status" && owner) {
      if (
        !["open", "in_progress", "resolved"].includes(String(input.status)) ||
        typeof input.updatedAt !== "string" ||
        input.updatedAt.length > 60 ||
        !Number.isFinite(Date.parse(input.updatedAt))
      )
        throw new OrderError("Reload the request before changing its status.");
      result = await client.rpc("set_support_status", {
        p_id: id,
        p_status: input.status,
        p_updated_at: input.updatedAt,
      });
    } else throw new OrderError("Choose a valid request action.");
    if (result.error) databaseOrderError(result.error);
    return json({ ok: true });
  } catch (e) {
    return orderFailure(e);
  }
}
