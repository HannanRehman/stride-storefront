export const metadata = { title: "Privacy & cookies" };
export default function Page() {
  return (
    <main id="main" className="info-page section">
      <h1>PRIVACY & COOKIES</h1>
      <p>
        This page describes the current public demo. It is not a substitute for
        a live merchant’s privacy policy.
      </p>
      <section>
        <h2>What is saved</h2>
        <p>
          Your bag and favorites are stored in this browser’s local storage
          under a Stride-specific key. They contain product identifiers, chosen
          sizes, quantities and saved product identifiers. No payment details,
          shipping addresses or passwords are collected in this version.
        </p>
      </section>
      <section>
        <h2>Cookies and tracking</h2>
        <p>
          This version does not install analytics, advertising scripts or
          optional tracking cookies. There are no optional cookie preferences to
          manage. The hosting provider may process ordinary request logs; review
          its policies before a public launch.
        </p>
      </section>
      <section>
        <h2>Catalog data</h2>
        <p>
          The storefront uses bundled demo catalog data unless a Supabase
          catalog is configured by its operator. In that case, the server reads
          published product data. Guest favorites and bag contents are still
          stored locally.
        </p>
      </section>
      <section>
        <h2>Clearing saved information</h2>
        <p>
          Remove items through your bag or favorites page, or clear site storage
          in your browser settings. Clearing storage removes your saved
          selections on this device.
        </p>
      </section>
    </main>
  );
}
