import { accountClient, authConfigured } from "@/lib/supabase-server";
import { json } from "@/lib/account-http";
export async function GET() {
  if (!authConfigured()) return json({ user: null });
  try {
    const client = await accountClient();
    const { data, error } = await client.auth.getUser();
    if (error && error.name !== "AuthSessionMissingError")
      return json(
        { error: "Could not check your account. Refresh and try again." },
        503,
      );
    return json({
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
    });
  } catch {
    return json(
      { error: "Could not check your account. Refresh and try again." },
      503,
    );
  }
}
