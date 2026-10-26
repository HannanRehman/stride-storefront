import { RequestList } from "@/components/support-requests";
export const metadata = { title: "Your help requests" };
export default function Page() {
  return (
    <>
      <h2>Your help requests</h2>
      <p>
        Questions, cancellation requests and return requests stay private to
        your account and the store team.
      </p>
      <RequestList />
    </>
  );
}
