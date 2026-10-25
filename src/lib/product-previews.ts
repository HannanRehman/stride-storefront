import type { Product } from "@/lib/catalog";

// Presentation only until stock is confirmed and the product is provisioned in
// Supabase. Never use this record for account shopping or inventory writes.
export const productPreviews: Product[] = [
  {
    id: "navy-hoodie-trouser-set",
    slug: "navy-hoodie-trouser-set",
    name: "Navy Hoodie & Trouser Set",
    subtitle: "Two-piece hoodie and trouser set",
    audience: "unisex",
    category: "clothing",
    sport: "Lifestyle",
    collection: "everyday",
    price: 700000,
    currency: "PKR",
    preview: true,
    image: "/images/products/navy-hoodie-trouser-set.webp",
    images: [
      {
        src: "/images/products/navy-hoodie-trouser-set.webp",
        alt: "Deep navy hoodie and matching folded trousers, complete two-piece set",
        label: "Full set",
      },
      {
        src: "/images/products/navy-hoodie.webp",
        alt: "Deep navy pullover hoodie with drawstring hood and ribbed cuffs",
        label: "Hoodie",
      },
      {
        src: "/images/products/navy-trouser.webp",
        alt: "Matching folded deep navy trousers with drawstring waistband and white printed detailing",
        label: "Trouser",
      },
    ],
    color: "Deep navy",
    colorHex: "#17283b",
    badge: "Product preview",
    sizes: ["S", "M", "L", "XL"].map((code) => ({ code, stock: 0 })),
    description:
      "One hoodie. One matching trouser. A coordinated deep navy pairing for everyday outfits, worn together or styled separately. The pullover hoodie features a drawstring hood, ribbed cuffs and a ribbed hem. The matching trousers feature a drawstring waistband and white printed detailing.",
    rank: -1,
    published: "2026-10-15",
  },
];

export function withProductPreviews(catalog: Product[]): Product[] {
  return [
    ...productPreviews.filter(
      (preview) =>
        !catalog.some(
          (product) =>
            product.id === preview.id || product.slug === preview.slug,
        ),
    ),
    ...catalog,
  ];
}
