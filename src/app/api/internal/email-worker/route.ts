import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { sendEmailJob, type EmailJob } from "@/lib/email";
import { json } from "@/lib/account-http";
export const maxDuration = 60;
export async function POST(request: Request) {
  const secret = process.env.EMAIL_WORKER_SECRET;
  const provided = request.headers.get("authorization") || "";
  if (
    !secret ||
    !timingSafeEqual(
      createHash("sha256").update(provided).digest(),
      createHash("sha256").update(`Bearer ${secret}`).digest(),
    )
  )
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
  const { data, error } = await client.rpc("claim_email_jobs", { p_limit: 3 });
  if (error) return json({ error: "Email queue is not available." }, 503);
  let sent = 0,
    failed = 0;
  for (const job of (data || []) as EmailJob[]) {
    let success = false,
      code = "";
    try {
      await sendEmailJob(job, { site, from, key: provider });
      success = true;
    } catch (e) {
      code =
        e instanceof Error && /^provider_http_\d{3}$/.test(e.message)
          ? e.message
          : "delivery_unconfirmed";
    }
    const ack = await client.rpc("finish_email_job", {
      p_id: job.id,
      p_lease: job.lease,
      p_sent: success,
      p_error: code,
    });
    if (ack.error || !ack.data)
      return json(
        {
          error:
            "Queue acknowledgement could not be confirmed. Inspect delivery state before retrying.",
        },
        503,
      );
    if (success) sent++;
    else failed++;
  }
  return json({ sent, failed });
}
