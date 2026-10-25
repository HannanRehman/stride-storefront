import { AuthPage } from "@/components/auth-page";
export const metadata = { title: "Sign in" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AuthPage mode="login" searchParams={searchParams} />;
}
