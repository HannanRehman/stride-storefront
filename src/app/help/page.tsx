import Link from "next/link";
export const metadata = { title: "Help & our story" };
export default function Page() {
  return (
    <main id="main" className="info-page section">
      <h1>
        A LITTLE HELP.
        <br />A LOT OF MOVEMENT.
      </h1>
      <p>
        Welcome to Stride, an original sportswear demo storefront. Explore our
        concepts, save favorites, and build a bag on your device.
      </p>
      <section id="our-story">
        <h2>Keep moving. Stay you.</h2>
        <p>
          Movement belongs to everyone. The fast days and the slow days. The
          first attempt and the everyday routine. Stride is an original design
          concept built around that simple idea.
        </p>
        <p>
          Our collections explore running, court culture, training and everyday
          essentials. Product names, campaign copy and generated images are
          original to this project.
        </p>
      </section>
      <section id="our-approach">
        <h2>Our approach</h2>
        <p>
          A clear view of the product, useful sizing information and space to
          explore. No fictional customer reviews or product-performance
          certifications. Our imagery and descriptions illustrate demo concepts.
        </p>
      </section>
      <section>
        <h2>Shopping here</h2>
        <p>
          Use category filters to narrow the catalog. Open a product, select an
          available size and add it to your bag. Hearts save favorites. Both
          your guest bag and favorites stay in this browser. Sign in to save
          them to your account and use them across devices.
        </p>
        <p>
          Purchasing is not enabled in this demo. Registration and password
          recovery depend on the store’s email setup; the account forms explain
          when those features are unavailable. For more information, see{" "}
          <Link href="/shipping-returns">shipping and returns</Link> or our{" "}
          <Link href="/privacy">privacy information</Link>.
        </p>
      </section>
      <section>
        <h2>Finding a fit</h2>
        <p>
          Our <Link href="/size-guide">size guide</Link> shows how to measure.
          Size charts are illustrative and need final product specifications
          before real sales.
        </p>
      </section>
    </main>
  );
}
