import { AuthPage } from "@/components/auth-page";
export const metadata = { title: "Forgot password" };
export default function Page() {
  return <AuthPage mode="recovery" />;
}
