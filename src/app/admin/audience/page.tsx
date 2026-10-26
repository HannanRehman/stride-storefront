import { AudienceManager } from "@/components/admin/audience-manager";
export default function Page() {
  return (
    <main id="main" className="admin-main">
      <h1>Launch audience</h1>
      <p>
        Manage permission-based launch interest. This screen does not send
        promotional emails. Configure the final sender before opening launch
        signup.
      </p>
      <AudienceManager />
    </main>
  );
}
