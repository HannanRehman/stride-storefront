import sharp from "sharp";
import { ownerClient, adminFailure } from "@/lib/admin-server";
import { AdminError } from "@/lib/admin-products";
import { assertSameOrigin, json } from "@/lib/account-http";
export const runtime = "nodejs";
const MAX = 4 * 1024 * 1024;
export async function POST(request: Request) {
  try {
    const { client, user } = await ownerClient();
    try {
      assertSameOrigin(request);
    } catch {
      throw new AdminError("Upload from this store's owner dashboard.");
    }
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
      throw new AdminError("Choose a photo to upload.");
    const reader = request.body?.getReader();
    if (!reader) throw new AdminError("Choose a photo to upload.");
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX + 65536) {
        await reader.cancel();
        throw new AdminError("Photos must be 4 MB or smaller.", 413);
      }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": request.headers.get("content-type")! },
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > MAX)
      throw new AdminError("Choose a photo of 4 MB or smaller.");
    if (!/\.(jpe?g|png|webp)$/i.test(file.name))
      throw new AdminError("Use a JPEG, PNG or WebP photo.");
    let image: Buffer;
    try {
      const source = sharp(Buffer.from(await file.arrayBuffer()), {
        limitInputPixels: 24000000,
      });
      const metadata = await source.metadata();
      if (
        !["jpeg", "png", "webp"].includes(metadata.format || "") ||
        (metadata.pages || 1) > 1
      )
        throw new Error("Unsupported photo");
      image = await source
        .rotate()
        .resize({
          width: 1800,
          height: 1800,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw new AdminError(
        "This file is not a supported still photo. Choose a valid JPEG, PNG or WebP.",
      );
    }
    const path = `${user.id}/${crypto.randomUUID()}.webp`;
    const { error } = await client.storage
      .from("catalog-media")
      .upload(path, image, { contentType: "image/webp", upsert: false });
    if (error)
      throw new AdminError(
        "The photo could not upload. Keep your edits and try again.",
        503,
      );
    return json(
      {
        src: client.storage.from("catalog-media").getPublicUrl(path).data
          .publicUrl,
      },
      201,
    );
  } catch (error) {
    return adminFailure(error);
  }
}
