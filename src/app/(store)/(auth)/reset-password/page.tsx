import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthPage } from "@/components/auth-page";
import { authenticatedClient } from "@/lib/supabase-server";
export const metadata = { title: "Reset password" };
export default async function Page() {
  const session = await authenticatedClient().catch(() => null);
  if (
    !session ||
    (await cookies()).get("stride-recovery")?.value !== session.user.id
  )
    redirect("/forgot-password");
  return <AuthPage mode="password" />;
}
