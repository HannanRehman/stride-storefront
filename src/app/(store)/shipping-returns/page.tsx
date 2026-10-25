export const metadata = { title: "Shipping & returns" };
export default function Page() {
  return (
    <main id="main" className="info-page section">
      <h1>SHIPPING & RETURNS</h1>
      <p>
        This public demo storefront is designed for browsing. It does not accept
        orders or payments, ship products, or operate physical pickup locations.
      </p>
      <section>
        <h2>Your saved bag</h2>
        <p>
          Adding a concept to your bag saves it locally on your device. It is
          not an order, does not reserve real stock, and does not create a
          delivery commitment. Displayed quantities are demonstration data.
        </p>
      </section>
      <section>
        <h2>Before real orders</h2>
        <p>
          Delivery regions, carriers, shipping charges, tax handling and returns
          terms will be supplied by the actual merchant before purchasing
          becomes available. No refund or delivery policy is implied by this
          demo.
        </p>
      </section>
    </main>
  );
}
