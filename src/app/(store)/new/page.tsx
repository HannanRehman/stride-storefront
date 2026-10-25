import { CatalogPage } from "@/components/catalog-page";
export const metadata = {
  title: "New & featured",
  alternates: { canonical: "/new" },
};
export default function Page() {
  return (
    <CatalogPage title="New & featured" constraints={{ fresh: true }}>
      <div className="listing-intro section">
        <p>A fresh perspective.</p>
        <h2>
          YOUR NEXT CHAPTER
          <br />
          STARTS HERE.
        </h2>
      </div>
    </CatalogPage>
  );
}
