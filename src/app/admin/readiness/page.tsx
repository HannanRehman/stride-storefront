import { Readiness } from "@/components/admin/readiness";
export default function Page() {
  return (
    <main id="main" className="admin-main">
      <h1>Launch readiness</h1>
      <p>
        What is configured, what is active and what still needs merchant setup.
      </p>
      <Readiness />
    </main>
  );
}
