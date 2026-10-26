import type { Audience, Category, Product } from "@/lib/catalog";

export type ProductRecord = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  audience: Audience;
  category: Category;
  sport: string;
  collection: string;
  price_minor: number;
  compare_at_minor: number | null;
  currency: "PKR" | "USD";
  image: string;
  images: { src: string; alt: string; label: string }[];
  color: string;
  color_hex: string;
  badge: string | null;
  sizes: { code: string; stock: number }[];
  description: string;
  featured_rank: number;
  published_at: string;
  published: boolean;
  ever_published: boolean;
  orderable?: boolean;
  updated_at: string;
};
export class AdminError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
function text(value: unknown, label: string, max: number, optional = false) {
  if (
    typeof value !== "string" ||
    (!optional && !value.trim()) ||
    value.trim().length > max
  )
    throw new AdminError(
      `${label} must contain ${optional ? "0" : "1"}–${max} characters.`,
    );
  return value.trim();
}
export function minorUnits(value: unknown): number {
  if (typeof value !== "string" || !/^\d{1,8}(?:\.\d{1,2})?$/.test(value))
    throw new AdminError(
      "Enter a valid price with at most two decimal places.",
    );
  const [whole, fraction = ""] = value.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (minor > 2147483647) throw new AdminError("Price is too large.");
  return minor;
}
export function allowedImage(value: unknown, supabaseUrl: string) {
  const src = text(value, "Image URL", 800);
  if (
    /^\/images\/[a-zA-Z0-9_./&-]+\.(?:webp|png|jpe?g)$/.test(src) &&
    !src.includes("..")
  )
    return src;
  try {
    const url = new URL(src);
    const project = new URL(supabaseUrl);
    if (
      url.origin === project.origin &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      /^\/storage\/v1\/object\/public\/catalog-media\/[a-zA-Z0-9_/-]+\.webp$/.test(
        url.pathname,
      )
    )
      return src;
  } catch {
    /* Fall through to a safe field error. */
  }
  throw new AdminError(
    "Choose a local product image or upload a photo to this store.",
  );
}
export function productInput(
  input: Record<string, unknown>,
  supabaseUrl: string,
) {
  const slug = text(input.slug, "Slug", 100);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    throw new AdminError(
      "Use lowercase letters, numbers and single hyphens for the slug.",
    );
  if (!["men", "women", "kids", "unisex"].includes(String(input.audience)))
    throw new AdminError("Choose a valid audience.");
  if (!["shoes", "clothing", "accessories"].includes(String(input.category)))
    throw new AdminError("Choose a valid category.");
  if (input.currency !== "PKR" && input.currency !== "USD")
    throw new AdminError("Choose PKR or USD.");
  if (
    !["everyday", "pace", "court", "motion"].includes(String(input.collection))
  )
    throw new AdminError(
      "Choose an existing collection: everyday, pace, court or motion.",
    );
  const price = minorUnits(input.price);
  const comparison =
    input.compareAt === "" ? null : minorUnits(input.compareAt);
  if (comparison !== null && comparison <= price)
    throw new AdminError(
      "Comparison price must be higher than the selling price.",
    );
  if (
    !Array.isArray(input.sizes) ||
    input.sizes.length < 1 ||
    input.sizes.length > 24
  )
    throw new AdminError("Add between 1 and 24 sizes.");
  const sizes = input.sizes.map((value: unknown) => {
    if (!value || typeof value !== "object")
      throw new AdminError("Invalid size entry.");
    const size = value as Record<string, unknown>;
    const code = text(size.code, "Size", 16);
    if (
      !Number.isInteger(size.stock) ||
      Number(size.stock) < 0 ||
      Number(size.stock) > 100
    )
      throw new AdminError(
        "Stock must be a whole number from 0 to 100 per size.",
      );
    return { code, stock: Number(size.stock) };
  });
  if (new Set(sizes.map((s) => s.code.toLowerCase())).size !== sizes.length)
    throw new AdminError("Each size must be unique.");
  if (
    !Array.isArray(input.images) ||
    input.images.length < 1 ||
    input.images.length > 6
  )
    throw new AdminError("Add between 1 and 6 product photos.");
  const images = input.images.map((value: unknown) => {
    if (!value || typeof value !== "object")
      throw new AdminError("Invalid photo entry.");
    const image = value as Record<string, unknown>;
    return {
      src: allowedImage(image.src, supabaseUrl),
      alt: text(image.alt, "Photo description", 200),
      label: text(image.label, "Photo label", 40),
    };
  });
  if (new Set(images.map((image) => image.src)).size !== images.length)
    throw new AdminError("Each photo must be different.");
  const hex = text(input.colorHex, "Color code", 7);
  if (!/^#[0-9a-fA-F]{6}$/.test(hex))
    throw new AdminError("Use a six-digit hex color, such as #17283b.");
  if (
    !Number.isInteger(input.rank) ||
    Number(input.rank) < 0 ||
    Number(input.rank) > 100000
  )
    throw new AdminError(
      "Display rank must be a whole number from 0 to 100000.",
    );
  if (typeof input.published !== "boolean")
    throw new AdminError("Choose draft or published status.");
  if (input.orderable !== undefined && typeof input.orderable !== "boolean")
    throw new AdminError("Choose checkout availability.");
  if (input.orderable && (input.currency !== "PKR" || price <= 0))
    throw new AdminError("Checkout-ready products need a positive PKR price.");
  return {
    orderable: input.orderable === true,
    slug,
    name: text(input.name, "Product name", 120),
    subtitle: text(input.subtitle, "Subtitle", 160),
    audience: input.audience as Audience,
    category: input.category as Category,
    sport: text(input.sport, "Movement", 80),
    collection: text(input.collection, "Collection", 80),
    price_minor: price,
    compare_at_minor: comparison,
    currency: input.currency,
    image: images[0].src,
    images,
    color: text(input.color, "Color", 80),
    color_hex: hex,
    badge: text(input.badge, "Badge", 40, true) || null,
    sizes,
    description: text(input.description, "Description", 4000),
    featured_rank: Number(input.rank),
    published: input.published,
  };
}
export function recordToProduct(row: ProductRecord): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    audience: row.audience,
    category: row.category,
    sport: row.sport,
    collection: row.collection,
    price: row.price_minor,
    compareAt: row.compare_at_minor ?? undefined,
    currency: row.currency,
    orderable: row.orderable === true,
    image: row.image,
    images: row.images?.length ? row.images : undefined,
    color: row.color,
    colorHex: row.color_hex,
    badge: row.badge ?? undefined,
    sizes: row.sizes,
    description: row.description,
    rank: row.featured_rank,
    published: row.published_at,
  };
}
