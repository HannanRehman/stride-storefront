import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main id="main" className="not-found">
      <h1>A DIFFERENT DIRECTION.</h1>
      <p>We couldn’t find that page. There’s plenty more to explore.</p>
      <Button asChild>
        <Link href="/shop/all">Explore Stride</Link>
      </Button>
    </main>
  );
}
