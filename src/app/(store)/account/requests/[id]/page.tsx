import { RequestDetail } from "@/components/support-requests";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RequestDetail id={id} key={id} />;
}
