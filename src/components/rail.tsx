"use client";
import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
export function Rail({
  title,
  href,
  children,
  className = "",
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const rail = useRef<HTMLDivElement>(null);
  function move(direction: number) {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    rail.current?.scrollBy({
      left: direction * rail.current.clientWidth * 0.85,
      behavior: reduced ? "instant" : "smooth",
    });
  }
  return (
    <section className={`section rail-section ${className}`}>
      <div className="section-heading">
        <h2>{title}</h2>
        <div className="rail-controls">
          {href && <Link href={href}>Shop all</Link>}
          <button
            aria-label={`Scroll ${title.toLowerCase()} left`}
            onClick={() => move(-1)}
            className="rail-arrow icon-button"
          >
            <ChevronLeft size={23} />
          </button>
          <button
            aria-label={`Scroll ${title.toLowerCase()} right`}
            onClick={() => move(1)}
            className="rail-arrow icon-button"
          >
            <ChevronRight size={23} />
          </button>
        </div>
      </div>
      <div ref={rail} className="horizontal-rail">
        {children}
      </div>
    </section>
  );
}
