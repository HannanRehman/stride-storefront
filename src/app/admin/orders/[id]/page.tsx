import { OrderDetail } from "@/components/order-detail";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main id="main" className="admin-main">
      <h1>Order details</h1>
      <OrderDetail id={id} key={id} owner />
    </main>
  );
}
