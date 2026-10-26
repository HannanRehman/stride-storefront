export type EmailJob = {
  id: string;
  lease: string;
  kind: "order_status" | "support_reply" | "launch_confirmation";
  recipient: string;
  payload: Record<string, string>;
};
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function emailMessage(job: EmailJob, site: string) {
  const origin = new URL(site);
  if (
    !["https:", "http:"].includes(origin.protocol) ||
    origin.username ||
    origin.password
  )
    throw new Error("Invalid site URL");
  let subject: string, text: string, url: string;
  if (job.kind === "order_status") {
    if (
      !/^[a-f0-9-]{36}$/i.test(job.payload.orderId) ||
      !["pending", "confirmed", "shipped", "delivered", "cancelled"].includes(
        job.payload.status,
      )
    )
      throw new Error("Invalid email payload");
    const ref = job.payload.orderId.slice(0, 8).toUpperCase();
    url = new URL(`/account/orders/${job.payload.orderId}`, origin).href;
    subject = `Order #${ref}: ${job.payload.status === "pending" ? "received" : job.payload.status}`;
    text =
      job.payload.status === "pending"
        ? "Your cash on delivery order has been received and is awaiting store confirmation."
        : `Your order is now ${job.payload.status}.`;
    text +=
      " Sign in to view the saved items, total and delivery details. No card payment has been taken.";
  } else if (job.kind === "support_reply") {
    if (!/^[a-f0-9-]{36}$/i.test(job.payload.requestId))
      throw new Error("Invalid email payload");
    subject = "A reply to your help request";
    text =
      "The store team has replied to your private help request. Sign in to read the reply.";
    url = new URL(`/account/requests/${job.payload.requestId}`, origin).href;
  } else {
    if (
      !/^[a-f0-9-]{36}$/i.test(job.payload.confirmationToken) ||
      !/^[a-f0-9-]{36}$/i.test(job.payload.unsubscribeToken)
    )
      throw new Error("Invalid email payload");
    subject = "Confirm your launch updates";
    text =
      "You asked to hear about the first launch. Confirm below to receive launch updates. If you did not sign up, ignore this email.";
    url = new URL(
      `/launch/preferences?action=confirm&token=${job.payload.confirmationToken}`,
      origin,
    ).href;
  }
  let plain = `${text}\n\n${url}`;
  let html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;line-height:1.6;color:#111"><h1 style="font-size:24px">${escape(subject)}</h1><p>${escape(text)}</p><p><a href="${escape(url)}">${job.kind === "launch_confirmation" ? "Confirm launch updates" : "View details"}</a></p>`;
  if (job.kind === "launch_confirmation") {
    const unsubscribe = new URL(
      `/launch/preferences?action=unsubscribe&token=${job.payload.unsubscribeToken}`,
      origin,
    ).href;
    plain += `\n\nStop launch updates: ${unsubscribe}`;
    html += `<p><a href="${escape(unsubscribe)}">Unsubscribe from launch updates</a></p>`;
  }
  return { subject, text: plain, html: html + "</div>" };
}
export async function sendEmailJob(
  job: EmailJob,
  config: { site: string; from: string; key: string },
  transport: typeof fetch = fetch,
) {
  const message = emailMessage(job, config.site);
  const response = await transport("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `store-email/${job.id}`,
    },
    body: JSON.stringify({
      from: config.from,
      to: [job.recipient],
      ...message,
    }),
    signal: AbortSignal.timeout(15000),
  });
  // Never return provider response bodies: they can contain recipient addresses.
  if (!response.ok) throw new Error(`provider_http_${response.status}`);
}
