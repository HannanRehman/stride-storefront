import Link from "next/link";
import { getSiteContent } from "@/lib/site-content-server";
export const metadata = {
  title: "Contact and customer help",
  alternates: { canonical: "/contact" },
};
export default async function Page() {
  const c = await getSiteContent();
  return (
    <main id="main" className="info-page section">
      <h1>Let’s get it sorted.</h1>
      <p>
        For questions about an order, sign in and open a private help request.
        You can follow the conversation in your account.
      </p>
      <p>
        <Link className="button button-primary" href="/account/requests/new">
          Open a help request
        </Link>
      </p>
      <section>
        <h2>Store contact</h2>
        {c.supportEmail && (
          <p>
            <a href={`mailto:${c.supportEmail}`}>{c.supportEmail}</a>
          </p>
        )}
        {c.supportPhone && (
          <p>
            <a href={`tel:${c.supportPhone.replace(/[^+\d]/g, "")}`}>
              {c.supportPhone}
            </a>
          </p>
        )}
        {c.supportHours && <p>{c.supportHours}</p>}
        {c.businessAddress && (
          <p className="plain-content">{c.businessAddress}</p>
        )}
        {!c.supportEmail && !c.supportPhone && (
          <p>
            Direct support contact details will be published before the store
            opens for orders.
          </p>
        )}
      </section>
      <section>
        <h2>Before sending a request</h2>
        <p>
          See{" "}
          <Link href="/shipping-returns">delivery and returns information</Link>{" "}
          and our <Link href="/size-guide">size guide</Link>. Never send
          passwords, banking PINs or payment card details.
        </p>
      </section>
    </main>
  );
}
