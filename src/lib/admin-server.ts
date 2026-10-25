import "server-only";
import { redirect } from "next/navigation";
import { accountClient } from "@/lib/supabase-server";
import { AdminError } from "@/lib/admin-products";
import { json } from "@/lib/account-http";
import { body } from "@/lib/account-http";
export async function adminBody(request: Request) {
  try {
    return await body(request);
  } catch {
    throw new AdminError(
      "Send a valid product form from this store's owner dashboard.",
    );
  }
}

export async function ownerClient() {
  const client = await accountClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    throw new AdminError("Sign in to access the owner dashboard.", 401);
  const membership = await client
    .from("store_owners")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (membership.error)
    throw new AdminError(
      "The owner dashboard is not activated yet. Complete the database setup first.",
      503,
    );
  if (!membership.data)
    throw new AdminError("This account does not have owner access.", 403);
  return { client, user: data.user };
}
export async function ownerPage(next = "/admin") {
  try {
    return { session: await ownerClient(), error: null };
  } catch (error) {
    if (error instanceof AdminError && error.status === 401)
      redirect(`/login?next=${encodeURIComponent(next)}`);
    return {
      session: null,
      error:
        error instanceof AdminError
          ? error.message
          : "The owner dashboard could not connect. Try again shortly.",
    };
  }
}
export function adminFailure(error: unknown) {
  return json(
    {
      error:
        error instanceof AdminError
          ? error.message
          : "The change could not be confirmed. Reload the saved product before trying again.",
    },
    error instanceof AdminError ? error.status : 503,
  );
}
