import Link from "next/link";
import { redirect } from "next/navigation";
import { authenticatedClient } from "@/lib/supabase-server";
import { SignOut } from "@/components/account-forms";
export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await authenticatedClient().catch(() => null);
  if (!session) redirect("/login?next=/account");
  return (
    <main id="main" className="account-page section">
      <h1>Your space.</h1>
      <div className="account-layout">
        <aside className="account-sidebar">
          <p className="account-email">{session.user.email}</p>
          <nav aria-label="Account navigation">
            <Link href="/account">Overview</Link>
            <Link href="/account/orders">Orders</Link>
            <Link href="/account/requests">Help requests</Link>
            <Link href="/account/profile">Profile</Link>
            <Link href="/account/addresses">Saved addresses</Link>
            <Link href="/favorites">Favorites</Link>
            <Link href="/cart">Your bag</Link>
          </nav>
          <SignOut />
        </aside>
        <div className="account-content">{children}</div>
      </div>
    </main>
  );
}
