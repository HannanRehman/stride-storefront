import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  defaultContent,
  contentInput,
  type SiteContent,
} from "@/lib/site-content";
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return defaultContent;
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.rpc("read_site_content");
    if (error || !data) return defaultContent;
    return contentInput({ ...defaultContent, ...data }, url);
  } catch {
    return defaultContent;
  }
});
