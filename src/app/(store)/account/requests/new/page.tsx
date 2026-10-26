import { NewRequest } from "@/components/support-requests";
export const metadata = { title: "New help request" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const value = (await searchParams).order;
  const initialOrder =
    typeof value === "string" && /^[a-f0-9-]{36}$/i.test(value) ? value : "";
  return (
    <>
      <h2>How can we help?</h2>
      <NewRequest initialOrder={initialOrder} />
    </>
  );
}
