import Image from "@/components/store-image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SiteContent } from "@/lib/site-content";
export function CampaignHero({ content: c }: { content: SiteContent }) {
  return (
    <section className="hero">
      <Image
        src={c.heroImage}
        alt={c.heroAlt}
        fill
        preload
        sizes="100vw"
        className="hero-image"
      />
      <div className="hero-shade" />
      <div className="hero-content">
        <p>{c.heroKicker}</p>
        <h1>
          {c.heroLine1}
          <br />
          {c.heroLine2}
        </h1>
        <p className="hero-description">{c.heroDescription}</p>
        <Button asChild variant="secondary">
          <Link href={c.heroHref}>
            {c.heroLabel}
            <ArrowUpRight size={17} />
          </Link>
        </Button>
      </div>
      <span className="hero-side-note">{c.heroNote}</span>
    </section>
  );
}
export function CampaignIntro({ content: c }: { content: SiteContent }) {
  return (
    <section className="campaign-intro">
      <p>A fresh start looks good on you.</p>
      <h2>{c.introTitle}</h2>
      <p>{c.introText}</p>
      <div>
        <Button asChild>
          <Link href="/men">Shop men</Link>
        </Button>
        <Button asChild>
          <Link href="/women">Shop women</Link>
        </Button>
      </div>
    </section>
  );
}
