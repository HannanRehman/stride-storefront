import Image from "@/components/store-image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Rail } from "@/components/rail";
import { ProductCard } from "@/components/product-card";
import { getCatalog } from "@/lib/catalog-server";
import { getSiteContent } from "@/lib/site-content-server";
import { CampaignHero, CampaignIntro } from "@/components/campaign-hero";
export const metadata = { alternates: { canonical: "/" } };
const campaigns = [
  {
    image: "/images/hero.webp",
    title: "A little further.",
    subtitle: "Running, at your pace.",
    href: "/collections/pace",
    link: "Shop running",
    className: "running-tile",
  },
  {
    image: "/images/court.webp",
    title: "Your court. Your rules.",
    subtitle: "A fresh perspective.",
    href: "/collections/court",
    link: "Shop Court",
  },
  {
    image: "/images/training.webp",
    title: "Put yourself in motion.",
    subtitle: "Show up for yourself.",
    href: "/collections/motion",
    link: "Shop training",
  },
];
export default async function Home() {
  const [products, content] = await Promise.all([
    getCatalog(),
    getSiteContent(),
  ]);
  const featured = [
    "navy-hoodie-trouser-set",
    "pace-01-men",
    "court-low-women",
    "motion-tee-men",
    "daypack-women",
    "everyday-form-kids",
    "court-low-se-men",
  ]
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p) => !!p);
  return (
    <main id="main">
      <CampaignHero content={content} />
      <CampaignIntro content={content} />
      <section className="section editorial-section">
        <div className="section-heading">
          <h2>For whatever moves you</h2>
          <Link href="/shop/all">
            Explore the collection <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="editorial-grid">
          {campaigns.map((c) => (
            <article
              key={c.title}
              className={`editorial-tile ${c.className || ""}`}
            >
              <Image
                src={c.image}
                alt={c.subtitle}
                fill
                sizes="(max-width: 639px) 85vw, 33vw"
              />
              <div className="tile-shade" />
              <div className="tile-copy">
                <p>{c.subtitle}</p>
                <h3>{c.title}</h3>
                <Button asChild variant="secondary">
                  <Link href={c.href}>{c.link}</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <Rail title="In good company" href="/new" className="product-rail">
        {featured.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </Rail>
      <section className="section category-section">
        <div className="section-heading">
          <h2>Your everyday lineup</h2>
          <Link href="/shop/all">
            Shop all <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="category-grid">
          {[
            {
              name: "Shoes",
              image: "/images/pace-shoe.webp",
              href: "/shop/shoes",
            },
            {
              name: "Clothing",
              image: "/images/tee.webp",
              href: "/shop/clothing",
            },
            {
              name: "Accessories",
              image: "/images/pack.webp",
              href: "/shop/accessories",
            },
          ].map((c) => (
            <Link key={c.name} href={c.href} className="category-tile">
              <div>
                <Image
                  src={c.image}
                  alt={
                    c.name === "Shoes"
                      ? "Original chalk running shoe"
                      : c.name === "Clothing"
                        ? "Original charcoal relaxed tee"
                        : "Original slate daypack"
                  }
                  fill
                  sizes="(max-width: 639px) 85vw, 33vw"
                />
              </div>
              <span>
                {c.name}
                <ArrowUpRight size={23} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <Rail
        title="Good things never stand still"
        href="/shop/shoes"
        className="collection-rail"
      >
        {[
          {
            name: "Pace 01",
            line: "Find your rhythm.",
            image: "/images/pace-shoe.webp",
            href: "/collections/pace",
          },
          {
            name: "Court Low",
            line: "Bring a fresh perspective.",
            image: "/images/court-shoe.webp",
            href: "/collections/court",
          },
          {
            name: "Everyday Form",
            line: "Make yourself at home.",
            image: "/images/pace-shoe.webp",
            href: "/collections/everyday",
          },
          {
            name: "Motion",
            line: "Room for your next move.",
            image: "/images/tee.webp",
            href: "/collections/motion",
          },
        ].map((c) => (
          <Link key={c.name} href={c.href} className="collection-card">
            <div>
              <Image
                src={c.image}
                alt={c.name}
                fill
                sizes="(max-width: 639px) 80vw, 32vw"
              />
            </div>
            <p>{c.name}</p>
            <span>{c.line}</span>
          </Link>
        ))}
      </Rail>
      <section className="section sport-section">
        <div className="section-heading">
          <h2>Find your field</h2>
        </div>
        <div className="sport-grid">
          {[
            { sport: "Running", image: "/images/hero.webp" },
            { sport: "Basketball", image: "/images/court.webp" },
            { sport: "Training", image: "/images/training.webp" },
          ].map((c) => (
            <Link
              key={c.sport}
              href={`/shop/all?sport=${c.sport}`}
              className={`sport-card sport-${c.sport.toLowerCase()}`}
            >
              <Image
                src={c.image}
                alt={`${c.sport} campaign`}
                fill
                sizes="(max-width: 639px) 85vw, 33vw"
              />
              <span>
                {c.sport}
                <ArrowUpRight size={19} />
              </span>
            </Link>
          ))}
        </div>
        <div className="sport-links">
          <Link href="/shop/all?sport=Lifestyle">
            Lifestyle
            <ArrowUpRight size={17} />
          </Link>
          <Link href="/shop/clothing">
            Clothing
            <ArrowUpRight size={17} />
          </Link>
          <Link href="/shop/accessories">
            Accessories
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <section className="brand-story">
        <span className="wordmark">stride.</span>
        <h2>
          THE BEST KIND OF PROGRESS
          <br />
          IS YOUR OWN.
        </h2>
        <p>
          Movement isn’t one thing. It’s your morning run, your last rep,
          <br className="desktop-break" /> your long way home. We’re here for
          all of it.
        </p>
        <Button asChild variant="secondary">
          <Link href="/help#our-story">
            Get to know Stride <ArrowUpRight size={17} />
          </Link>
        </Button>
      </section>
      <nav
        className="category-matrix section"
        aria-label="Explore popular categories"
      >
        {[
          {
            title: "Shoes",
            links: [
              ["All shoes", "/shop/shoes"],
              ["Running shoes", "/shop/shoes?sport=Running"],
              ["Court shoes", "/shop/shoes?sport=Basketball"],
              ["Everyday shoes", "/shop/shoes?sport=Lifestyle"],
            ],
          },
          {
            title: "Clothing",
            links: [
              ["All clothing", "/shop/clothing"],
              ["Training tees", "/shop/clothing?sport=Training"],
              ["Everyday tees", "/shop/clothing?sport=Lifestyle"],
              ["New clothing", "/new?category=clothing"],
            ],
          },
          {
            title: "By movement",
            links: [
              ["Running", "/shop/all?sport=Running"],
              ["Basketball", "/shop/all?sport=Basketball"],
              ["Training", "/shop/all?sport=Training"],
              ["Lifestyle", "/shop/all?sport=Lifestyle"],
            ],
          },
          {
            title: "For everyone",
            links: [
              ["Men", "/men"],
              ["Women", "/women"],
              ["Kids", "/kids"],
              ["Accessories", "/shop/accessories"],
            ],
          },
        ].map((group) => (
          <div key={group.title}>
            <h3>{group.title}</h3>
            {group.links.map(([label, href]) => (
              <Link key={label} href={href}>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </main>
  );
}
