import { SizeGuide } from "@/components/size-guide";
export const metadata = { title: "Size guide" };
export default function Page() {
  return (
    <main id="main" className="info-page section">
      <h1>FIND YOUR FIT.</h1>
      <p>
        Use these measurement guides as a starting point. These are illustrative
        charts for demo concepts; a live store needs manufacturer-specific
        measurements for every product and audience.
      </p>
      <section>
        <h2>Adult footwear</h2>
        <SizeGuide category="shoes" audience="men" />
      </section>
      <section>
        <h2>Youth footwear</h2>
        <SizeGuide category="shoes" audience="kids" />
      </section>
      <section>
        <h2>Adult clothing</h2>
        <SizeGuide category="clothing" />
      </section>
    </main>
  );
}
