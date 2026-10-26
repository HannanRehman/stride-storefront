import { revalidatePath } from "next/cache";
import { ownerClient } from "@/lib/admin-server";
import {
  orderBody,
  orderFailure,
  databaseOrderError,
} from "@/lib/orders-server";
import { contentInput } from "@/lib/site-content";
import { OrderError } from "@/lib/orders";
import { json } from "@/lib/account-http";
export async function GET() {
  try {
    const { client } = await ownerClient();
    const result = await client
      .from("site_content")
      .select("draft,published,version,published_at")
      .eq("id", "home")
      .single();
    if (result.error) databaseOrderError(result.error);
    const revisions = await client
      .from("site_content_revisions")
      .select("id,created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    if (revisions.error) databaseOrderError(revisions.error);
    return json({ content: result.data, revisions: revisions.data });
  } catch (e) {
    return orderFailure(e);
  }
}
export async function POST(request: Request) {
  try {
    const { client } = await ownerClient();
    const input = await orderBody(request);
    if (!Number.isSafeInteger(input.version) || Number(input.version) < 0)
      throw new OrderError("Reload content before saving.");
    let result;
    if (input.action === "save")
      result = await client.rpc("save_site_content", {
        p_document: contentInput(
          input.document,
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
        ),
        p_version: input.version,
      });
    else if (input.action === "publish")
      result = await client.rpc("publish_site_content", {
        p_version: input.version,
      });
    else if (input.action === "restore" && typeof input.revision === "string")
      result = await client.rpc("restore_site_content", {
        p_revision: input.revision,
        p_version: input.version,
      });
    else throw new OrderError("Choose save, publish or restore.");
    if (result.error) databaseOrderError(result.error);
    revalidatePath("/", "layout");
    return json({ ok: true });
  } catch (e) {
    return orderFailure(e);
  }
}
