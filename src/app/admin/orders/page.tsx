import { OrderList } from "@/components/order-list";
import { CheckoutSettings } from "@/components/admin/checkout-settings";
import Link from "next/link";
export default function Page() {
  return (
    <main id="main" className="admin-main">
      <h1>Orders</h1>
      <p>Confirm, prepare and track cash on delivery orders.</p>
      <section className="checkout-message">
        <h2>Try an order</h2>
        <p>
          Use the test set to try checkout and every order status with your
          store account. Public ordering can stay closed. Test orders use
          simulated stock and send no order emails.
        </p>
        <Link href="/product/checkout-test-set" className="order-link-button">
          Start a test order
        </Link>
      </section>
      <OrderList owner />
      <CheckoutSettings />
    </main>
  );
}
