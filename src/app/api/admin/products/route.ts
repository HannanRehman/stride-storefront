import { catalogWrite } from "@/lib/catalog-write";
import { revalidatePath } from "next/cache";
import { ownerClient, adminFailure, adminBody } from "@/lib/admin-server";
import { AdminError, productInput } from "@/lib/admin-products";
import { json } from "@/lib/account-http";

export async function GET(request: Request) {
  try {
    const { client } = await ownerClient();
    const params = new URL(request.url).searchParams;
    const search = (params.get("q") || "")
      .trim()
      .slice(0, 100)
      .replace(/[%_\\]/g, "");
    const page = Math.max(
      1,
      Math.min(10000, Math.floor(Number(params.get("page")) || 1)),
    );
    let query = client
      .from("catalog_products")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id")
      .range((page - 1) * 20, page * 20 - 1);
    if (search) query = query.ilike("name", `%${search}%`);
    if (params.get("status") === "draft") query = query.eq("published", false);
    if (params.get("status") === "published")
      query = query.eq("published", true);
    const { data, count, error } = await query;
    if (error)
      throw new AdminError(
        "Could not load products. Check the connection and retry.",
        503,
      );
    return json({ products: data, count, page });
  } catch (error) {
    return adminFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    const { client } = await ownerClient();
    const input = await adminBody(request);
    const product = productInput(input, process.env.NEXT_PUBLIC_SUPABASE_URL!);
    if (product.published)
      throw new AdminError("Create the product as a draft before publishing.");
    const { data, error } = await catalogWrite(client, {
      ...product,
      id: crypto.randomUUID(),
      published_at: new Date().toISOString().slice(0, 10),
    });
    if (error?.code === "23505")
      throw new AdminError("That slug is already in use. Choose another.", 409);
    if (error) throw error;
    return json({ product: data }, 201);
  } catch (error) {
    return adminFailure(error);
  }
}
export async function PATCH(request: Request) {
  try {
    const { client } = await ownerClient();
    const input = await adminBody(request);
    if (
      typeof input.id !== "string" ||
      input.id.length > 100 ||
      typeof input.updatedAt !== "string" ||
      input.updatedAt.length > 60
    )
      throw new AdminError("Reload the product before saving.");
    const product = productInput(input, process.env.NEXT_PUBLIC_SUPABASE_URL!);
    const { data, error } = await catalogWrite(client, product, {
      id: input.id,
      updatedAt: input.updatedAt,
    });
    if (error?.code === "23505")
      throw new AdminError("That slug is already in use. Choose another.", 409);
    if (error?.message.includes("published slug"))
      throw new AdminError(
        "A previously published product's slug cannot change.",
        409,
      );
    if (error) throw error;
    if (!data)
      throw new AdminError(
        "This product changed in another session. Reload it before saving again.",
        409,
      );
    revalidatePath("/", "layout");
    revalidatePath("/sitemap.xml");
    return json({ product: data });
  } catch (error) {
    return adminFailure(error);
  }
}
