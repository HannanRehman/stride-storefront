import type { Product } from "@/lib/catalog";

// Presentation only until stock is confirmed and each item is provisioned in
// Supabase. These previews cannot be purchased or used for inventory writes.
type PreviewInput = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "subtitle"
  | "price"
  | "image"
  | "images"
  | "color"
  | "colorHex"
  | "description"
  | "rank"
>;

function preview(input: PreviewInput): Product {
  return {
    ...input,
    audience: "unisex",
    category: "clothing",
    sport: "Lifestyle",
    collection: "everyday",
    currency: "PKR",
    preview: true,
    badge: "Product preview",
    sizes: ["S", "M", "L", "XL"].map((code) => ({ code, stock: 0 })),
    published: "2026-10-30",
  };
}

const photo = (src: string, alt: string, label: string) => ({
  src: `/images/products/${src}`,
  alt,
  label,
});

const darkHoodie = photo(
  "charcoal-hoodie.jpg",
  "Charcoal hoodie with a square chest logo",
  "Hoodie",
);
const darkTrouser = photo(
  "charcoal-trouser-front.jpg",
  "Charcoal jogger trousers with drawstring waist and logo patch",
  "Trouser",
);
const taupeHoodie = photo(
  "taupe-hoodie.jpg",
  "Taupe hoodie with a square chest logo",
  "Hoodie",
);
const taupeTrouser = photo(
  "taupe-trouser-front.jpg",
  "Taupe jogger trousers with drawstring waist and logo patch",
  "Trouser",
);
const grayOutdoorHoodie = photo(
  "light-gray-outdoor-hoodie-front.jpg",
  "Light gray outdoor graphic hoodie, front view",
  "Front",
);
const grayOutdoorBack = photo(
  "light-gray-outdoor-hoodie-back.jpg",
  "Light gray outdoor graphic hoodie, back view",
  "Back",
);
const grayTrouser = photo(
  "light-gray-trouser.jpg",
  "Light gray graphic jogger trousers",
  "Trouser",
);
const navyHoodie = photo(
  "navy-hoodie.jpg",
  "Deep navy pullover hoodie on a plain studio background",
  "Hoodie",
);
const navyTrouser = photo(
  "navy-trouser.jpg",
  "Deep navy jogger trousers on a plain studio background",
  "Trouser",
);

export const productPreviews: Product[] = [
  preview({
    id: "charcoal-hoodie",
    slug: "charcoal-hoodie",
    name: "Charcoal Hoodie",
    subtitle: "Pullover hoodie with chest logo",
    price: 650000,
    image: darkHoodie.src,
    images: [darkHoodie],
    color: "Charcoal",
    colorHex: "#504e49",
    description:
      "A charcoal pullover hoodie with a drawstring hood, ribbed cuffs and a square chest logo. Matching charcoal trousers are listed separately.",
    rank: 0,
  }),
  preview({
    id: "charcoal-trouser",
    slug: "charcoal-trouser",
    name: "Charcoal Trouser",
    subtitle: "Drawstring jogger trouser",
    price: 650000,
    image: darkTrouser.src,
    images: [
      darkTrouser,
      photo(
        "charcoal-trouser-detail.jpg",
        "Second view of the charcoal drawstring jogger trousers",
        "Detail",
      ),
    ],
    color: "Charcoal",
    colorHex: "#504e49",
    description:
      "Charcoal jogger trousers with a drawstring waist and logo patch. Pair them with the matching charcoal hoodie or wear them separately.",
    rank: 1,
  }),
  preview({
    id: "charcoal-hoodie-trouser-set",
    slug: "charcoal-hoodie-trouser-set",
    name: "Charcoal Hoodie & Trouser Set",
    subtitle: "Two-piece hoodie and jogger set",
    price: 1200000,
    image: darkHoodie.src,
    images: [darkHoodie, darkTrouser],
    color: "Charcoal",
    colorHex: "#504e49",
    description:
      "A matching charcoal hoodie and drawstring jogger trouser set. The hoodie and trousers are also available separately.",
    rank: 2,
  }),
  preview({
    id: "taupe-hoodie",
    slug: "taupe-hoodie",
    name: "Taupe Hoodie",
    subtitle: "Pullover hoodie with chest logo",
    price: 650000,
    image: taupeHoodie.src,
    images: [taupeHoodie],
    color: "Taupe",
    colorHex: "#8c8173",
    description:
      "A taupe pullover hoodie with drawstring hood, ribbed cuffs and a square chest logo. Matching taupe trousers are listed separately.",
    rank: 3,
  }),
  preview({
    id: "taupe-trouser",
    slug: "taupe-trouser",
    name: "Taupe Trouser",
    subtitle: "Drawstring jogger trouser",
    price: 650000,
    image: taupeTrouser.src,
    images: [
      taupeTrouser,
      photo(
        "taupe-trouser-detail.jpg",
        "Second view of the taupe drawstring jogger trousers",
        "Detail",
      ),
    ],
    color: "Taupe",
    colorHex: "#8c8173",
    description:
      "Taupe jogger trousers with a drawstring waist and logo patch. Pair them with the matching taupe hoodie or wear them separately.",
    rank: 4,
  }),
  preview({
    id: "taupe-hoodie-trouser-set",
    slug: "taupe-hoodie-trouser-set",
    name: "Taupe Hoodie & Trouser Set",
    subtitle: "Two-piece hoodie and jogger set",
    price: 1200000,
    image: taupeHoodie.src,
    images: [taupeHoodie, taupeTrouser],
    color: "Taupe",
    colorHex: "#8c8173",
    description:
      "A matching taupe hoodie and drawstring jogger trouser set. The hoodie and trousers are also available separately.",
    rank: 5,
  }),
  preview({
    id: "light-gray-outdoor-hoodie",
    slug: "light-gray-outdoor-hoodie",
    name: "Light Gray Graphic Hoodie",
    subtitle: "Pullover outdoor graphic hoodie",
    price: 650000,
    image: grayOutdoorHoodie.src,
    images: [grayOutdoorHoodie, grayOutdoorBack],
    color: "Light gray",
    colorHex: "#c8c9c7",
    description:
      "A light gray pullover hoodie with front and back graphic details. Matching light gray trousers are listed separately.",
    rank: 6,
  }),
  preview({
    id: "light-gray-trouser",
    slug: "light-gray-trouser",
    name: "Light Gray Graphic Trouser",
    subtitle: "Graphic jogger trouser",
    price: 650000,
    image: grayTrouser.src,
    images: [grayTrouser],
    color: "Light gray",
    colorHex: "#c8c9c7",
    description:
      "Light gray jogger trousers with graphic detailing. Pair them with the matching light gray hoodie or wear them separately.",
    rank: 7,
  }),
  preview({
    id: "light-gray-hoodie-trouser-set",
    slug: "light-gray-hoodie-trouser-set",
    name: "Light Gray Hoodie & Trouser Set",
    subtitle: "Two-piece graphic hoodie and trouser set",
    price: 1200000,
    image: grayOutdoorHoodie.src,
    images: [grayOutdoorHoodie, grayOutdoorBack, grayTrouser],
    color: "Light gray",
    colorHex: "#c8c9c7",
    description:
      "A matching light gray graphic hoodie and jogger trouser set. The hoodie and trousers are also available separately.",
    rank: 8,
  }),
  preview({
    id: "light-gray-just-do-it-hoodie",
    slug: "light-gray-just-do-it-hoodie",
    name: "Light Gray Just Do It Hoodie",
    subtitle: "Graphic pullover hoodie",
    price: 650000,
    image: "/images/products/light-gray-just-do-it-hoodie.jpg",
    images: [
      photo(
        "light-gray-just-do-it-hoodie.jpg",
        "Light gray pullover hoodie with front graphic",
        "Front",
      ),
      photo(
        "light-gray-just-do-it-detail.jpg",
        "Close view of the light gray hoodie front graphic",
        "Graphic detail",
      ),
    ],
    color: "Light gray",
    colorHex: "#c8c9c7",
    description:
      "A light gray pullover hoodie with a front pouch pocket and Just Do It graphic.",
    rank: 9,
  }),
  preview({
    id: "navy-hoodie",
    slug: "navy-hoodie",
    name: "Navy Hoodie",
    subtitle: "Pullover hoodie",
    price: 650000,
    image: navyHoodie.src,
    images: [
      navyHoodie,
      photo(
        "navy-hoodie-source.jpg",
        "Alternate view of the deep navy pullover hoodie",
        "Alternate view",
      ),
    ],
    color: "Deep navy",
    colorHex: "#17283b",
    description:
      "A deep navy pullover hoodie with a drawstring hood, chest logo, ribbed cuffs and hem. Matching navy trousers are listed separately.",
    rank: 10,
  }),
  preview({
    id: "navy-trouser",
    slug: "navy-trouser",
    name: "Navy Trouser",
    subtitle: "Drawstring jogger trouser",
    price: 650000,
    image: navyTrouser.src,
    images: [
      navyTrouser,
      photo(
        "navy-trouser-detail.jpg",
        "Alternate view of the deep navy jogger trousers",
        "Alternate view",
      ),
    ],
    color: "Deep navy",
    colorHex: "#17283b",
    description:
      "Deep navy jogger trousers with a drawstring waist and printed details. Pair them with the matching navy hoodie or wear them separately.",
    rank: 11,
  }),
  preview({
    id: "navy-hoodie-trouser-set",
    slug: "navy-hoodie-trouser-set",
    name: "Navy Hoodie & Trouser Set",
    subtitle: "Two-piece hoodie and trouser set",
    price: 1200000,
    image: "/images/products/navy-set.jpg",
    images: [
      photo(
        "navy-set.jpg",
        "Deep navy hoodie and matching trousers on a plain studio background",
        "Full set",
      ),
      photo(
        "navy-set-front.jpg",
        "Navy hoodie and trousers together, front view",
        "Front view",
      ),
      photo(
        "navy-set-detail.jpg",
        "Alternate view of the navy hoodie and trouser set",
        "Alternate view",
      ),
    ],
    color: "Deep navy",
    colorHex: "#17283b",
    description:
      "A matching deep navy hoodie and drawstring jogger trouser set. The hoodie and trousers are also available separately.",
    rank: 12,
  }),
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
