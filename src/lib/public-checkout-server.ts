import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
export const publicCheckoutOpen = cache(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return false;
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client
      .from("checkout_settings")
      .select("enabled")
      .eq("id", true)
      .single();
    return !error && data?.enabled === true;
  } catch {
    return false;
  }
});
