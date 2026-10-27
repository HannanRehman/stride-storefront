"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
const sections = [
  ["/admin", "Overview"],
  ["/admin/products", "Products"],
  ["/admin/orders", "Orders"],
  ["/admin/requests", "Requests"],
  ["/admin/content", "Content"],
  ["/admin/audience", "Audience"],
  ["/admin/readiness", "Launch readiness"],
  ["/admin/security", "Security"],
];
export function AdminNavigation() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const selected = (href: string) =>
    href === "/admin"
      ? path === href
      : path === href || path.startsWith(href + "/");
  const current =
    sections.find(([href]) => selected(href))?.[1] || "Owner workspace";
  return (
    <div className="admin-navigation">
      <button
        className="admin-menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="store-management"
        onClick={() => setOpen(!open)}
      >
        <span>{current}</span>
        <span>
          {open ? "Close menu" : "Menu"}{" "}
          {open ? <X size={18} /> : <Menu size={18} />}
        </span>
      </button>
      <nav id="store-management" aria-label="Store management" data-open={open}>
        {sections.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            aria-current={selected(href) ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            {label}
          </Link>
        ))}
        <Link href="/" className="admin-store-link">
          View storefront
        </Link>
      </nav>
    </div>
  );
}
