import Link from "next/link";
import { redirect } from "next/navigation";
import { ownerIdentity } from "@/lib/admin-server";
import { AdminError } from "@/lib/admin-products";
import { safeAdminNext } from "@/lib/account-validation";
import { OwnerSecurity } from "@/components/admin/security";
import { SignOut } from "@/components/account-forms";

export const metadata = {
  title: "Verify owner sign-in",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = safeAdminNext((await searchParams).next);
  let session;
  try {
    session = await ownerIdentity();
  } catch (error) {
    if (error instanceof AdminError && error.status === 401)
      redirect(`/login?next=${encodeURIComponent(next)}`);
    if (error instanceof AdminError && error.status === 403)
      redirect("/account");
    return (
      <main id="main" className="owner-verification">
        <h1>Verification unavailable</h1>
        <p role="alert">
          Your owner session could not be checked. Try again shortly.
        </p>
        <Link href={`/auth/verify?next=${encodeURIComponent(next)}`}>
          Try again
        </Link>
      </main>
    );
  }
  const { data, error } =
    await session.client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!error && data.currentLevel === "aal2") redirect(next);
  return (
    <main id="main" className="owner-verification">
      <header>
        <Link className="wordmark" href="/">
          stride.
        </Link>
        <SignOut />
      </header>
      <div className="verification-card">
        <p className="verification-progress">
          Password accepted · Authenticator verification
        </p>
        <h1>
          {session.mfaRequired
            ? "Verify your sign-in."
            : "Secure your owner account."}
        </h1>
        <p className="verification-intro">
          {session.mfaRequired
            ? "One more step before opening the owner portal."
            : "Set up an authenticator and verify its code before opening the owner portal."}
        </p>
        {error ? (
          <p role="alert">
            Your verification session could not be checked. Reload this page or
            sign in again.
          </p>
        ) : (
          <div className="mfa-gate">
            <OwnerSecurity verification />
          </div>
        )}
        <p className="verification-note">
          Your dashboard stays locked until verification succeeds.
        </p>
      </div>
    </main>
  );
}
