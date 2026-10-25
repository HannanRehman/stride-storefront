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
          Guest bag items and favorites are stored in this browser’s local
          storage. When you sign in, those selections are merged into your
          private account and saved in Supabase. Your account can also store
          your name, phone number and addresses you choose to add. Supabase Auth
          manages your sign-in email and password. No payment details are
          collected.
        </p>
      </section>
      <section>
        <h2>Cookies and tracking</h2>
        <p>
          Essential session cookies keep you signed in and support confirmation
          and password recovery. This version does not install analytics,
          advertising scripts or optional tracking cookies. The hosting and
          authentication providers may process ordinary request and security
          logs.
        </p>
      </section>
      <section>
        <h2>Catalog data</h2>
        <p>
          The storefront uses bundled demo catalog data unless a Supabase
          catalog is configured by its operator. In that case, the server reads
          published product data. Guest selections stay local until a successful
          account merge; account selections are protected by ownership rules.
        </p>
      </section>
      <section>
        <h2>Clearing saved information</h2>
        <p>
          Remove items through your bag or favorites page, or clear site storage
          in your browser settings. Clearing browser storage removes guest
          selections and local sessions; it does not delete account data in
          Supabase. You can edit your profile and remove saved addresses through
          your account. Contact the store owner for account deletion requests.
        </p>
      </section>
    </main>
  );
}
