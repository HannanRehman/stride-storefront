import { getSiteContent } from "@/lib/site-content-server";
export const metadata = { title: "Privacy & cookies" };
export default async function Page() {
  const content = await getSiteContent();
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
        <h2>Checkout and order records</h2>
        <p>
          When ordering is open, placing an order saves your delivery name,
          mobile number, address, purchased items, prices and order history in
          Supabase. Your signed-in account and store owners can view these
          records. Cash on delivery does not collect card or banking details.
          The store uses delivery details to fulfill your order and provide them
          to its delivery partner when arranging shipment.
        </p>
        <p>
          An unfinished checkout attempt is kept in this tab’s session storage,
          including the delivery form and reviewed total, so a retry can check
          the same order rather than create a duplicate. It is removed when the
          order is confirmed by the website. Closing the tab clears this local
          recovery information; it does not cancel an order already received.
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
        <h2>Help requests and launch updates</h2>
        <p>
          Help requests save your messages, request type, related order and
          conversation history. Only your account and store owners can read
          them. An unconfirmed new request is kept in this tab’s session storage
          so you can retry the same attempt after a connection problem.
        </p>
        <p>
          If you choose launch updates, we save your email, permission version,
          confirmation and unsubscribe state. Signing up does not create an
          account or reserve a product. Launch emails require confirmation and
          you can unsubscribe using the preference link. When email delivery is
          configured, the store’s email provider processes the recipient address
          and notification content; delivery details remain in your private
          account rather than being copied into notification emails.
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
      {content.privacyInfo && (
        <section>
          <h2>Store privacy information</h2>
          <p className="plain-content">{content.privacyInfo}</p>
        </section>
      )}
    </main>
  );
}
