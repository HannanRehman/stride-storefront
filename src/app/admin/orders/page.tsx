import { OrderList } from "@/components/order-list";
import { CheckoutSettings } from "@/components/admin/checkout-settings";
export default function Page() {
  return (
    <main id="main" className="admin-main">
      <h1>Orders</h1>
      <p>Confirm, prepare and track cash on delivery orders.</p>
      <OrderList owner />
      <CheckoutSettings />
    </main>
  );
}
