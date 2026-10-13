import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const source = process.argv[2];
if (!source) throw new Error("Pass the generated-image source folder.");
const files = {
  hero: "exec-2ab2ab3e-cab3-4500-ace8-d5c6624739ab.png",
  court: "exec-0c16eaf7-614d-415a-80f5-dad50d941d38.png",
  "pace-shoe": "exec-f6e190af-6734-44c9-8144-5c369a0df4dc.png",
  "court-shoe": "exec-4f5f2f20-fb40-4fee-9b6d-339c92eaaa8a.png",
  training: "exec-76d9a45c-9138-4356-b4b6-99f3c3b5735f.png",
  tee: "exec-7dec771d-d24d-4b98-b3c3-b3d2aa26af52.png",
  pack: "exec-bacb8620-c897-499d-b8cf-c51926c18eac.png",
};
await mkdir("public/images", { recursive: true });
await mkdir("artifacts", { recursive: true });
const metadata = [];
for (const [name, file] of Object.entries(files)) {
  const input = path.join(source, file);
  const result = await sharp(input)
    .resize({ width: name === "hero" ? 1920 : 1100, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(`public/images/${name}.webp`);
  metadata.push({
    name,
    asset: `/images/${name}.webp`,
    width: result.width,
    height: result.height,
    bytes: result.size,
    provenance:
      "Original generated image; built-in imagegen tool, no reference images.",
  });
}
await writeFile("docs/assets.json", JSON.stringify(metadata, null, 2) + "\n");
const tiles = await Promise.all(
  Object.keys(files).map(async (name, index) => ({
    input: await sharp(`public/images/${name}.webp`)
      .resize(400, 300, { fit: "contain", background: "#f5f5f5" })
      .png()
      .toBuffer(),
    left: (index % 3) * 400,
    top: Math.floor(index / 3) * 300,
  })),
);
await sharp({
  create: { width: 1200, height: 900, channels: 3, background: "#f5f5f5" },
})
  .composite(tiles)
  .png()
  .toFile("artifacts/asset-review.png");
console.log(
  JSON.stringify(
    metadata.map(({ name, bytes }) => ({ name, bytes })),
    null,
    2,
  ),
);
