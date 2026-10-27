import { createHash, timingSafeEqual } from "node:crypto";
import { sendEmailJob, type EmailJob } from "./email";

export function emailWorkerAuthorized(request: Request, secret?: string) {
  if (!secret || secret.length < 32) return false;
  const provided = request.headers.get("authorization") || "";
  return timingSafeEqual(
    createHash("sha256").update(provided).digest(),
    createHash("sha256").update(`Bearer ${secret}`).digest(),
  );
}

type QueueClient = {
  rpc: (
    name: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};

export async function deliverEmailBatch(
  client: QueueClient,
  config: Parameters<typeof sendEmailJob>[1],
  send = sendEmailJob,
) {
  const { data, error } = await client.rpc("claim_email_jobs", { p_limit: 3 });
  if (error || !Array.isArray(data))
    throw new Error("Email queue is not available.");
  let sent = 0,
    failed = 0;
  for (const job of data as EmailJob[]) {
    let success = false,
      code = "";
    try {
      await send(job, config);
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
    if (ack.error || ack.data !== true)
      throw new Error(
        "Queue acknowledgement could not be confirmed. Inspect delivery state before retrying.",
      );
    if (success) sent++;
    else failed++;
  }
  return { sent, failed };
}
