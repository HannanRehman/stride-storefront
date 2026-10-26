import { getSiteContent } from "@/lib/site-content-server";
export const metadata = { title: "Shipping & returns" };
export default async function Page() {
  const content = await getSiteContent();
  return (
    <main id="main" className="info-page section">
      <h1>SHIPPING & RETURNS</h1>
      <p>
        The store is preparing for launch. Demo items remain for browsing and
        cannot be purchased. Ordering opens separately for eligible products.
      </p>
      <section>
        <h2>Your saved bag</h2>
        <p>
          Adding an item to your bag saves it on your device or signed-in
          account. It does not reserve stock or create an order. Eligible stock
          is reserved only after checkout successfully receives an order.
        </p>
      </section>
      <section>
        <h2>Delivery and payment</h2>
        <p>
          Checkout supports delivery within Pakistan and cash on delivery. The
          reviewed order total includes the delivery charge; pay this total to
          the courier. Orders await store confirmation before shipment. Courier
          and tracking details appear in your account once the parcel ships.
        </p>
      </section>
      <section>
        <h2>Launch information still to come</h2>
        <p>
          Delivery timelines, service coverage, store contact details and the
          final return and refund conditions must be published before public
          ordering opens. No return window or delivery date is promised by this
          prelaunch page.
        </p>
      </section>
      {content.shippingInfo && (
        <section>
          <h2>Delivery information</h2>
          <p className="plain-content">{content.shippingInfo}</p>
        </section>
      )}
      {content.returnsInfo && (
        <section>
          <h2>Returns and refunds</h2>
          <p className="plain-content">{content.returnsInfo}</p>
        </section>
      )}
    </main>
  );
}
