import { LaunchAction } from "@/components/launch-form";
export const metadata = {
  title: "Launch email preferences",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const action = p.action === "unsubscribe" ? "unsubscribe" : "confirm";
  const token =
    typeof p.token === "string" && /^[a-f0-9-]{36}$/i.test(p.token)
      ? p.token
      : "";
  return (
    <main id="main" className="info-page section">
      <h1>
        {action === "confirm" ? "Your launch updates" : "Email preferences"}
      </h1>
      {token ? (
        <>
          <p>
            Choose below to save this preference. Opening the page alone does
            not change your subscription.
          </p>
          <LaunchAction action={action} token={token} />
        </>
      ) : (
        <p>Open the complete preference link from your email.</p>
      )}
    </main>
  );
}
