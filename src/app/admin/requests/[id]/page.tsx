import { RequestDetail } from "@/components/support-requests";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main id="main" className="admin-main">
      <h1>Customer request</h1>
      <RequestDetail id={id} key={id} owner />
    </main>
  );
}
