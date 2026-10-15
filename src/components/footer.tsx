import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
const groups = [
  {
    title: "Shop",
    links: [
      ["All products", "/shop/all"],
      ["New arrivals", "/new"],
      ["Shoes", "/shop/shoes"],
      ["Clothing", "/shop/clothing"],
    ],
  },
  {
    title: "Collections",
    links: [
      ["Pace", "/collections/pace"],
      ["Court", "/collections/court"],
      ["Everyday", "/collections/everyday"],
      ["Motion", "/collections/motion"],
    ],
  },
  {
    title: "Help",
    links: [
      ["Get help", "/help"],
      ["Size guide", "/size-guide"],
      ["Shipping & returns", "/shipping-returns"],
      ["Your bag", "/cart"],
    ],
  },
  {
    title: "Stride",
    links: [
      ["Our story", "/help#our-story"],
      ["Our approach", "/help#our-approach"],
      ["Favorites", "/favorites"],
      ["Your account", "/account"],
      ["Privacy", "/privacy"],
    ],
  },
];
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link href="/" className="wordmark" aria-label="Stride home">
          stride.
        </Link>
        <p>Keep moving. Stay you.</p>
        <Link href="#top" className="back-top">
          Back to top <ArrowUpRight size={19} />
        </Link>
      </div>
      <div className="footer-columns">
        {groups.map((group) => (
          <details key={group.title} open>
            <summary>{group.title}</summary>
            <div>
              {group.links.map(([label, href]) => (
                <Link key={href} href={href}>
                  {label}
                </Link>
              ))}
            </div>
          </details>
        ))}
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} Stride. Original demo storefront.
        </span>
        <span>Prices shown per item · Demo storefront</span>
        <div>
          <Link href="/terms">Terms of use</Link>
          <Link href="/privacy">Privacy & cookies</Link>
        </div>
      </div>
    </footer>
  );
}
