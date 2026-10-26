import { RequestList } from "@/components/support-requests";
export default function Page() {
  return (
    <main id="main" className="admin-main">
      <h1>Customer requests</h1>
      <p>
        Review questions and order requests. Replies appear in the customer’s
        account.
      </p>
      <RequestList owner />
    </main>
  );
}
