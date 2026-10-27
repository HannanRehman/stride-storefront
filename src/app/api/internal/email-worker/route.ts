import { createClient } from "@supabase/supabase-js";
import { deliverEmailBatch, emailWorkerAuthorized } from "@/lib/email-worker";
import { json } from "@/lib/account-http";
export const maxDuration = 60;
// Vercel Cron invokes GET with CRON_SECRET; trusted manual invocations use POST
// with a separate worker secret. Both paths fail closed before claiming jobs.
export async function GET(request: Request) {
  return run(request, process.env.CRON_SECRET);
}
export async function POST(request: Request) {
  return run(request, process.env.EMAIL_WORKER_SECRET);
}
async function run(request: Request, secret?: string) {
  if (!emailWorkerAuthorized(request, secret))
    return json({ error: "Not authorized." }, 401);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY,
    provider = process.env.RESEND_API_KEY,
    from = process.env.EMAIL_FROM,
    site = process.env.NEXT_PUBLIC_SITE_URL;
  if (
    process.env.EMAIL_DELIVERY_ENABLED !== "true" ||
    !url ||
    !key ||
    !provider ||
    !from ||
    !site
  )
    return json(
      { error: "Email delivery is disabled or not configured." },
      503,
    );
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    return json(
      await deliverEmailBatch(client, {
        site,
        from,
        key: provider,
        brand: process.env.EMAIL_BRAND_NAME || "Stride Storefront",
      }),
    );
  } catch {
    // Do not expose private provider/queue responses or uncertain job details.
    return json(
      {
        error:
          "Email processing could not be confirmed. Inspect delivery state before retrying.",
      },
      503,
    );
  }
}
