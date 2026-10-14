import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export function authConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export async function accountClient() {
  if (!authConfigured()) throw new Error("Accounts are not configured yet.");
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Server-component writes are refreshed by Proxy. */
          }
        },
      },
    },
  );
}
export async function authenticatedClient() {
  const client = await accountClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Please sign in to continue.");
  return { client, user: data.user };
}
export async function requireAccount() {
  const session = await authenticatedClient().catch(() => null);
  if (!session) redirect("/login?next=/account");
  return session;
}
