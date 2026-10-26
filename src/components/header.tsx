"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { useStore } from "@/components/store-provider";
import { filterProducts } from "@/lib/catalog";
import { money } from "@/lib/utils";
const navigation = [
  { label: "New & featured", href: "/new" },
  { label: "Men", href: "/men" },
  { label: "Women", href: "/women" },
  { label: "Kids", href: "/kids" },
  { label: "Sale", href: "/shop/all?sale=true" },
];
export function Header({
  announcement = "Meet the Pace collection",
  announcementHref = "/collections/pace",
}: {
  announcement?: string;
  announcementHref?: string;
}) {
  const { bag, favorites, catalog, user } = useStore();
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [mega, setMega] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const router = useRouter();
  const matches = query.trim()
    ? filterProducts(catalog, { q: query }).slice(0, 5)
    : [];
  const count = bag.reduce((sum, item) => sum + item.quantity, 0);
  useEffect(() => {
    function close(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setMega(null);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setMega(null);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  function searchSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    const href =
      active >= 0 && matches[active]
        ? `/product/${matches[active].slug}`
        : `/search?q=${encodeURIComponent(trimmed)}`;
    setSearch(false);
    setActive(-1);
    router.push(href);
  }
  return (
    <>
      <div className="utility-bar">
        <span>Movement is for everyone.</span>
        <div>
          <Link href="/help">Help</Link>
          <span aria-hidden="true">|</span>
          <Link href="/help#our-story">Our story</Link>
          <span aria-hidden="true">|</span>
          <Link href={user ? "/account" : "/login"}>
            {user ? "Your account" : "Sign in"}
          </Link>
        </div>
      </div>
      <header
        ref={root}
        className="main-header"
        onMouseLeave={() => setMega(null)}
      >
        <Link href="/" aria-label="Stride home" className="wordmark">
          stride<span className="wordmark-dot">.</span>
        </Link>
        <nav
          className="desktop-nav"
          aria-label="Main navigation"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setMega(null);
          }}
        >
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onMouseEnter={() => setMega(item.label)}
              onFocus={() => setMega(item.label)}
              onClick={() => setMega(null)}
              aria-expanded={mega === item.label}
            >
              {item.label}
            </Link>
          ))}
          {mega && (
            <div className="mega-menu">
              <div className="mega-inner">
                <div>
                  <h2>Explore {mega.toLowerCase()}</h2>
                  <Link
                    href={navigation.find((i) => i.label === mega)!.href}
                    onClick={() => setMega(null)}
                  >
                    Shop all <ArrowUpRight size={17} />
                  </Link>
                  <Link href="/new" onClick={() => setMega(null)}>
                    New arrivals
                  </Link>
                  <Link
                    href="/shop/all?sale=true"
                    onClick={() => setMega(null)}
                  >
                    Sale
                  </Link>
                </div>
                <div>
                  <h2>Shop by category</h2>
                  {["shoes", "clothing", "accessories"].map((category) => (
                    <Link
                      key={category}
                      href={
                        mega === "Men" || mega === "Women" || mega === "Kids"
                          ? `/${mega.toLowerCase()}/${category}`
                          : `/shop/${category}`
                      }
                      onClick={() => setMega(null)}
                    >
                      {category[0].toUpperCase() + category.slice(1)}
                    </Link>
                  ))}
                </div>
                <div>
                  <h2>Find your movement</h2>
                  {["Running", "Basketball", "Training", "Lifestyle"].map(
                    (sport) => (
                      <Link
                        key={sport}
                        href={`/shop/all?sport=${sport}${["Men", "Women", "Kids"].includes(mega) ? `&audience=${mega.toLowerCase()}` : ""}`}
                        onClick={() => setMega(null)}
                      >
                        {sport}
                      </Link>
                    ),
                  )}
                </div>
                <div className="mega-story">
                  <p>
                    A fresh pace.
                    <br />A new perspective.
                  </p>
                  <Link href="/collections/pace" onClick={() => setMega(null)}>
                    Explore Pace <ArrowUpRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>
        <div className="header-actions">
          <Link
            className="icon-button account-header"
            href={user ? "/account" : "/login"}
            aria-label={user ? "Your account" : "Sign in"}
          >
            <UserRound size={21} />
          </Link>
          <button
            className="search-trigger"
            onClick={() => {
              setSearch(true);
              setMega(null);
            }}
            aria-label="Search products"
          >
            <Search size={21} />
            <span>Search</span>
          </button>
          <Link
            className="icon-button favorite-header"
            href="/favorites"
            aria-label={`Favorites, ${favorites.length} saved products`}
          >
            <Heart size={23} />
          </Link>
          <Link
            className="icon-button bag-button"
            href="/cart"
            aria-label={`Bag, ${count} items`}
          >
            <ShoppingBag size={22} />
            {count > 0 && <span className="bag-count">{count}</span>}
          </Link>
          <button
            className="icon-button mobile-menu-button"
            onClick={() => setMobile(true)}
            aria-label="Open navigation"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>
      <div className="announcement">
        <span>A fresh pace starts here.</span>
        <Link href={announcementHref}>{announcement}</Link>
      </div>
      <Dialog open={mobile} onOpenChange={setMobile}>
        <DialogContent className="side-sheet">
          <DialogTitle className="wordmark">stride.</DialogTitle>
          <DialogDescription className="sr-only">
            Explore our collections and shopping categories.
          </DialogDescription>
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <div key={item.label}>
                <DialogClose asChild>
                  <Link href={item.href}>
                    {item.label}
                    <ArrowUpRight size={22} />
                  </Link>
                </DialogClose>
                {["Men", "Women", "Kids"].includes(item.label) && (
                  <div className="mobile-subnav">
                    {["shoes", "clothing"].map((category) => (
                      <DialogClose key={category} asChild>
                        <Link href={`/${item.label.toLowerCase()}/${category}`}>
                          {category}
                        </Link>
                      </DialogClose>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <DialogClose asChild>
              <Link href="/favorites">
                Favorites
                <Heart size={20} />
              </Link>
            </DialogClose>
            <DialogClose asChild>
              <Link href="/help">Help & our story</Link>
            </DialogClose>
            <DialogClose asChild>
              <Link href={user ? "/account" : "/login"}>
                {user ? "Your account" : "Sign in / create account"}
              </Link>
            </DialogClose>
          </nav>
        </DialogContent>
      </Dialog>
      <Dialog open={search} onOpenChange={setSearch}>
        <DialogContent className="search-dialog">
          <DialogTitle>Find your next favorite.</DialogTitle>
          <DialogDescription>
            Search shoes, clothing, collections, or your sport.
          </DialogDescription>
          <form onSubmit={searchSubmit} className="search-form">
            <Search size={23} />
            <input
              aria-label="Search products"
              placeholder="Search Stride"
              maxLength={100}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(-1);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((i) => Math.min(matches.length - 1, i + 1));
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(-1, i - 1));
                }
              }}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={matches.length > 0}
              aria-controls="search-suggestions"
              aria-activedescendant={
                active >= 0 ? `suggestion-${active}` : undefined
              }
            />
            <button type="submit" aria-label="Submit search">
              <ArrowUpRight size={23} />
            </button>
          </form>
          {query.trim() ? (
            <div
              id="search-suggestions"
              role="listbox"
              className="search-suggestions"
            >
              {matches.length ? (
                matches.map((p, i) => (
                  <button
                    key={p.id}
                    id={`suggestion-${i}`}
                    role="option"
                    aria-selected={active === i}
                    className={active === i ? "active" : ""}
                    onClick={() => {
                      setSearch(false);
                      router.push(`/product/${p.slug}`);
                    }}
                  >
                    <span>
                      {p.name}
                      <small>{p.subtitle}</small>
                    </span>
                    <span>{money(p.price, p.currency)}</span>
                  </button>
                ))
              ) : (
                <p>No matches yet. Try “Pace”, “tee”, or “running”.</p>
              )}
              <button
                className="search-all"
                onClick={() => {
                  setSearch(false);
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                }}
              >
                See all results for “{query.trim()}”<ArrowUpRight size={18} />
              </button>
            </div>
          ) : (
            <div className="popular-searches">
              <p>Popular searches</p>
              {["Pace", "Running", "Court", "Training", "Tee"].map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${term}`}
                  onClick={() => setSearch(false)}
                >
                  {term}
                </Link>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
