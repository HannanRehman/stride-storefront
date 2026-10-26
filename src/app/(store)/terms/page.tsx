import { getSiteContent } from "@/lib/site-content-server";
export const metadata = { title: "Terms of use" };
export default async function Page() {
  const content = await getSiteContent();
  return (
    <main id="main" className="info-page section">
      <h1>TERMS OF USE</h1>
      <p>
        Stride is preparing for launch. Demo product concepts remain
        illustrative and cannot be purchased. Ordering opens separately for
        products the store has made available for checkout.
      </p>
      <section>
        <h2>Browsing and ordering</h2>
        <p>
          You may browse, save favorites and build a bag, with account syncing
          when you sign in. When ordering is open, review the product sizes,
          delivery address and full total before placing a cash on delivery
          order. Your account shows the received order and its status. Orders
          await store confirmation; no online payment is taken.
        </p>
      </section>
      <section>
        <h2>Original identity</h2>
        <p>
          The Stride branding, copy and generated campaign imagery were created
          for this project. Third-party open-source software and fonts remain
          subject to their respective licenses.
        </p>
      </section>
      <section>
        <h2>Future sales</h2>
        <p>
          A merchant must provide final product information, contact details and
          appropriate commercial policies before enabling real sales.
        </p>
      </section>
      {content.termsInfo && (
        <section>
          <h2>Store terms</h2>
          <p className="plain-content">{content.termsInfo}</p>
        </section>
      )}
    </main>
  );
}
