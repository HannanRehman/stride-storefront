export type Audience = "men" | "women" | "kids" | "unisex";
export type Category = "shoes" | "clothing" | "accessories";
export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  audience: Audience;
  category: Category;
  sport: string;
  collection: string;
  price: number;
  currency?: "USD" | "PKR";
  preview?: boolean;
  orderable?: boolean;
  testOnly?: boolean;
  compareAt?: number;
  image: string;
  images?: { src: string; alt: string; label: string }[];
  color: string;
  colorHex: string;
  badge?: string;
  sizes: { code: string; stock: number }[];
  description: string;
  rank: number;
  published: string;
};
const shoeSizes = [
  "6",
  "6.5",
  "7",
  "7.5",
  "8",
  "8.5",
  "9",
  "9.5",
  "10",
  "10.5",
  "11",
  "12",
];
const families = [
  {
    name: "Pace 01",
    category: "shoes" as const,
    sport: "Running",
    collection: "pace",
    image: "/images/pace-shoe.webp",
    color: "Chalk / Graphite",
    colorHex: "#eeeae4",
    price: 12800,
    type: "Road running shoes",
    description:
      "Find a little more in every mile. Breathable engineered knit, a supportive midfoot and a generous cushioned sole bring an easy rhythm to everyday runs.",
  },
  {
    name: "Court Low",
    category: "shoes" as const,
    sport: "Basketball",
    collection: "court",
    image: "/images/court-shoe.webp",
    color: "Slate / Chalk",
    colorHex: "#718294",
    price: 11000,
    type: "Court-inspired shoes",
    description:
      "A fresh perspective on an everyday staple. Soft suede, clean geometric panels and a low-profile sole take you from the court to whatever comes next.",
  },
  {
    name: "Everyday Form",
    category: "shoes" as const,
    sport: "Lifestyle",
    collection: "everyday",
    image: "/images/pace-shoe.webp",
    color: "Chalk / Graphite",
    colorHex: "#eeeae4",
    price: 9800,
    type: "Everyday shoes",
    description:
      "An easy fit for the way you move. A soft knit upper and cushioned sole make this lightweight concept a versatile everyday companion.",
  },
  {
    name: "Motion Tee",
    category: "clothing" as const,
    sport: "Training",
    collection: "motion",
    image: "/images/tee.webp",
    color: "Black",
    colorHex: "#242424",
    price: 4200,
    type: "Relaxed training tee",
    description:
      "Room to move, space to breathe. A relaxed silhouette with a clean crew neck and soft-touch fabric makes a dependable starting point for your everyday kit.",
  },
  {
    name: "Everyday Tee",
    category: "clothing" as const,
    sport: "Lifestyle",
    collection: "everyday",
    image: "/images/tee.webp",
    color: "Black",
    colorHex: "#242424",
    price: 3800,
    type: "Everyday cotton tee",
    description:
      "A considered essential. Substantial cotton, a comfortable relaxed fit and a simple finish make this original tee concept easy to wear on repeat.",
  },
  {
    name: "Daypack",
    category: "accessories" as const,
    sport: "Training",
    collection: "motion",
    image: "/images/pack.webp",
    color: "Slate",
    colorHex: "#737a80",
    price: 6800,
    type: "Training backpack",
    description:
      "Pack a change of pace. Durable woven fabric, a roomy main compartment and a geometric front pocket keep your daily essentials close at hand.",
  },
] as const;
const audiences: Audience[] = ["men", "women", "kids"];
export const products: Product[] = families.flatMap((family, familyIndex) =>
  audiences.flatMap((audience, audienceIndex) =>
    [0, 1].map((edition) => {
      const rank = familyIndex * 6 + audienceIndex * 2 + edition;
      const kidsReduction = family.category === "clothing" ? 1400 : 2800;
      const price =
        family.price -
        (audience === "kids" ? kidsReduction : 0) +
        edition * 1200;
      const sale = edition === 1 && familyIndex % 2 === 0;
      const name = `${family.name}${edition ? " SE" : ""}`;
      const slug = `${name.toLowerCase().replaceAll(" ", "-")}-${audience}`;
      const codes =
        family.category === "shoes"
          ? audience === "kids"
            ? [
                "1Y",
                "1.5Y",
                "2Y",
                "2.5Y",
                "3Y",
                "3.5Y",
                "4Y",
                "4.5Y",
                "5Y",
                "6Y",
              ]
            : shoeSizes
          : family.category === "clothing"
            ? ["XS", "S", "M", "L", "XL", "XXL"]
            : ["One size"];
      return {
        ...family,
        id: slug,
        slug,
        name,
        audience,
        subtitle: `${audience === "kids" ? "Kids'" : audience === "men" ? "Men's" : "Women's"} ${family.type.toLowerCase()}`,
        price: sale ? price - 2500 : price,
        compareAt: sale ? price : undefined,
        badge: sale ? "Sale" : edition === 0 ? "Just in" : "Best seller",
        sizes: codes.map((code, i) => ({
          code,
          stock: i === 1 || i === 5 ? 0 : 8,
        })),
        rank,
        published: `2026-10-${String(14 - (rank % 10)).padStart(2, "0")}`,
      };
    }),
  ),
);
export const collections = {
  pace: {
    name: "Pace",
    headline: "Find your rhythm.",
    description: "For the first mile. And the miles after that.",
    image: "/images/hero.webp",
  },
  court: {
    name: "Court",
    headline: "Make your own play.",
    description: "A fresh perspective, on and off the court.",
    image: "/images/court.webp",
  },
  everyday: {
    name: "Everyday",
    headline: "A good day starts here.",
    description: "Considered essentials. Endless possibilities.",
    image: "/images/training.webp",
  },
  motion: {
    name: "Motion",
    headline: "Room to move.",
    description: "Made for the work you put in.",
    image: "/images/training.webp",
  },
};
export type CatalogFilters = {
  audience?: string;
  category?: string;
  sport?: string[];
  color?: string[];
  size?: string[];
  sale?: boolean;
  fresh?: boolean;
  collection?: string;
  q?: string;
  price?: string[];
  sort?: string;
  page?: number;
};
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function filterProducts(source: Product[], filters: CatalogFilters) {
  const results = source.filter((p) => {
    if (p.testOnly) return false;
    if (
      filters.audience &&
      p.audience !== filters.audience &&
      p.audience !== "unisex"
    )
      return false;
    if (
      filters.category &&
      filters.category !== "all" &&
      p.category !== filters.category
    )
      return false;
    if (filters.collection && p.collection !== filters.collection) return false;
    if (filters.sale && !p.compareAt) return false;
    if (filters.fresh && p.badge !== "Just in") return false;
    if (filters.sport?.length && !filters.sport.includes(p.sport)) return false;
    if (
      filters.color?.length &&
      !filters.color.some((c) => normalize(p.color).includes(normalize(c)))
    )
      return false;
    if (
      filters.size?.length &&
      !p.sizes.some((s) => filters.size!.includes(s.code) && s.stock > 0)
    )
      return false;
    if (
      filters.price?.length &&
      ((p.currency ?? "USD") !== "USD" ||
        !filters.price.some((range) => {
          const [min, max] = range.split("-").map(Number);
          return p.price >= min * 100 && p.price < (max || Infinity) * 100;
        }))
    )
      return false;
    if (
      filters.q &&
      !normalize(
        `${p.name} ${p.subtitle} ${p.sport} ${p.collection} ${p.color}`,
      ).includes(normalize(filters.q.trim()))
    )
      return false;
    return true;
  });
  return results.sort((a, b) => {
    const tie = a.slug.localeCompare(b.slug);
    // Never compare raw rupee and dollar amounts as if they were one currency.
    if (filters.sort === "price-asc" || filters.sort === "price-desc") {
      const currencyGroup = (a.currency ?? "USD").localeCompare(
        b.currency ?? "USD",
      );
      if (currencyGroup) return currencyGroup;
    }
    if (filters.sort === "price-asc") return a.price - b.price || tie;
    if (filters.sort === "price-desc") return b.price - a.price || tie;
    if (filters.sort === "newest")
      return b.published.localeCompare(a.published) || tie;
    if (filters.sort === "best")
      return (
        Number(b.badge === "Best seller") - Number(a.badge === "Best seller") ||
        a.rank - b.rank ||
        tie
      );
    return a.rank - b.rank || tie;
  });
}
export function parseFilters(
  params: Record<string, string | string[] | undefined>,
): CatalogFilters {
  const value = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : "";
  const list = (key: string) =>
    value(key).split(",").filter(Boolean).slice(0, 20);
  return {
    audience: ["men", "women", "kids", "unisex"].includes(value("audience"))
      ? value("audience")
      : undefined,
    category: ["shoes", "clothing", "accessories", "all"].includes(
      value("category"),
    )
      ? value("category")
      : undefined,
    q: value("q").slice(0, 100),
    sport: list("sport"),
    color: list("color"),
    size: list("size"),
    price: list("price"),
    sale: value("sale") === "true",
    sort: ["featured", "price-asc", "price-desc", "newest", "best"].includes(
      value("sort"),
    )
      ? value("sort")
      : "featured",
    page: Math.max(1, Math.min(10000, Math.floor(Number(value("page")) || 1))),
  };
}
