import Link from "next/link";
import { SignOut } from "@/components/account-forms";
import { ownerPage } from "@/lib/admin-server";
import { AdminNavigation } from "@/components/admin/navigation";
import { headers } from "next/headers";
import "./admin.css";
export const metadata = {
  title: "Owner dashboard",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = (await headers()).get("x-store-path");
  const { session, error } = await ownerPage(
    path === "/admin/security" ? path : "/admin",
  );
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="wordmark">
          stride.
        </Link>
        <p>Owner workspace</p>
        <AdminNavigation />
        {session && (
          <div className="admin-identity">
            <span>{session.user.email}</span>
            <SignOut />
          </div>
        )}
      </aside>
      {error ? (
        <main id="main" className="admin-main">
          <h1>Owner access</h1>
          <p role="alert" className="admin-message">
            {error}
          </p>
          <p>
            Use the account assigned as this store’s owner. Database activation
            instructions are in the project’s owner dashboard setup guide.
          </p>
          <Link href="/login?next=/admin">Sign in with another account</Link>
        </main>
      ) : (
        children
      )}
    </div>
  );
}
