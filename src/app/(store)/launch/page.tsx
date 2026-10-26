import { getSiteContent } from "@/lib/site-content-server";
import { LaunchForm } from "@/components/launch-form";
export const metadata = {
  title: "First launch",
  description:
    "Hear when the first collection is ready. Opt in to launch updates.",
  alternates: { canonical: "/launch" },
};
export default async function Page() {
  const content = await getSiteContent();
  return (
    <main id="main" className="info-page section">
      <h1>Good things take shape.</h1>
      <p>
        The first collection is still being prepared. There is no launch date or
        product reservation to promise yet.
      </p>
      {content.launchEnabled ? (
        <>
          <h2>Hear about the first launch</h2>
          <LaunchForm />
        </>
      ) : (
        <p>Launch signup is not open yet. Check back here for updates.</p>
      )}
    </main>
  );
}
