import { ownerClient, adminFailure } from "@/lib/admin-server";
import { AdminError } from "@/lib/admin-products";
import { json } from "@/lib/account-http";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { client } = await ownerClient();
    const { id } = await params;
    const { data, error } = await client
      .from("catalog_products")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new AdminError("Product not found.", 404);
    return json({ product: data });
  } catch (error) {
    return adminFailure(error);
  }
}
