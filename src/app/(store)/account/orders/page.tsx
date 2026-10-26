import { OrderList } from "@/components/order-list";
export const metadata = { title: "Your orders" };
export default function Page() {
  return (
    <>
      <h2>Your orders</h2>
      <p>Follow your cash on delivery orders here.</p>
      <OrderList />
    </>
  );
}
