import { OrderDetail } from "@/components/order-detail";
export const metadata = { title: "Order details" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetail id={id} key={id} />;
}
