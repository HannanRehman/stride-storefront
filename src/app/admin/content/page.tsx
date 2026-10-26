import { ContentEditor } from "@/components/admin/content-editor";
export default function Page() {
  return (
    <main id="main" className="admin-main">
      <h1>Store content</h1>
      <p>
        Edit a draft, preview it, then publish when ready. The provisional brand
        and product catalog stay separate.
      </p>
      <ContentEditor />
    </main>
  );
}
