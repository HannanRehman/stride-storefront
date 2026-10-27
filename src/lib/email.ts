import { emailLayout, type EmailLayout } from "./email-template";

export type EmailJob = {
  id: string;
  lease: string;
  kind: "order_status" | "support_reply" | "launch_confirmation";
  recipient: string;
  payload: Record<string, string>;
};
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const orderCopy = {
  pending: {
    heading: "Your order is in.",
    paragraphs: [
      "Your cash on delivery order has been received and is awaiting store confirmation.",
      "No online payment has been taken. Sign in to view your items, total and delivery details.",
    ],
    action: "View your order",
  },
  confirmed: {
    heading: "Confirmed. Next, preparation.",
    paragraphs: [
      "The store team has confirmed your order. You can follow its progress in your account.",
      "Pay the order total to the courier when it arrives. We will update your order when it has been handed over for delivery.",
    ],
    action: "View your order",
  },
  shipped: {
    heading: "Handed to the courier.",
    paragraphs: [
      "Your order has been marked as shipped. Sign in to see the courier and tracking reference saved by the store team.",
      "Delivery progress depends on the courier. Your account shows the latest information provided by the store.",
    ],
    action: "View tracking details",
  },
  delivered: {
    heading: "Delivery recorded.",
    paragraphs: [
      "The store team has marked your order as delivered and your cash payment as collected.",
      "If the parcel has not reached you, or something needs attention, open a private help request from your order page.",
    ],
    action: "View your order",
  },
  cancelled: {
    heading: "Your order was cancelled.",
    paragraphs: [
      "The store team has cancelled your order. You can view its recorded history in your account.",
      "No online payment was taken by this website. Contact the store if you have a question about the cancellation.",
    ],
    action: "View order details",
  },
};

export function emailMessage(
  job: EmailJob,
  site: string,
  brand = "Stride Storefront",
) {
  const origin = new URL(site);
  if (
    !(
      origin.protocol === "https:" ||
      (origin.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname))
    ) ||
    origin.username ||
    origin.password
  )
    throw new Error("Invalid site URL");
  if (!brand.trim() || brand.length > 100 || /[\r\n\u0000-\u001f]/.test(brand))
    throw new Error("Invalid sender name");
  const layout: EmailLayout = {
    brand: brand.trim(),
    subject: "",
    preheader: "",
    heading: "",
    paragraphs: [],
    action: "",
    url: "",
    contact: new URL("/contact", origin.origin).href,
  };
  if (job.kind === "order_status") {
    if (
      !uuid.test(job.payload.orderId) ||
      !Object.hasOwn(orderCopy, job.payload.status)
    )
      throw new Error("Invalid email payload");
    const ref = job.payload.orderId.slice(0, 8).toUpperCase();
    const status = job.payload.status as keyof typeof orderCopy;
    Object.assign(layout, orderCopy[status], {
      subject: `Order #${ref}: ${status === "pending" ? "received" : status}`,
      preheader: orderCopy[status].heading,
      url: new URL(`/account/orders/${job.payload.orderId}`, origin.origin)
        .href,
      details: [
        ["Order", `#${ref}`],
        ["Payment method", "Cash on delivery"],
      ],
    });
  } else if (job.kind === "support_reply") {
    if (!uuid.test(job.payload.requestId))
      throw new Error("Invalid email payload");
    Object.assign(layout, {
      subject: "A reply to your help request",
      preheader: "Your conversation is waiting in your account.",
      heading: "The team has replied.",
      paragraphs: [
        "There is a new reply to your private help request.",
        "Sign in to read the conversation and respond. Delivery details and private messages stay inside your account.",
      ],
      action: "Read the reply",
      url: new URL(`/account/requests/${job.payload.requestId}`, origin.origin)
        .href,
    });
  } else if (job.kind === "launch_confirmation") {
    if (
      !uuid.test(job.payload.confirmationToken) ||
      !uuid.test(job.payload.unsubscribeToken)
    )
      throw new Error("Invalid email payload");
    Object.assign(layout, {
      subject: "Confirm your launch updates",
      preheader: "Confirm that you want launch updates.",
      heading: "Want to hear about the launch?",
      paragraphs: [
        "You asked to hear about our first launch. Confirm below if you would like us to keep you updated.",
        "If you did not sign up, ignore this email. You will not be added to launch announcements without confirmation.",
      ],
      action: "Confirm launch updates",
      url: new URL(
        `/launch/preferences?action=confirm&token=${job.payload.confirmationToken}`,
        origin.origin,
      ).href,
      unsubscribe: new URL(
        `/launch/preferences?action=unsubscribe&token=${job.payload.unsubscribeToken}`,
        origin.origin,
      ).href,
    });
  } else throw new Error("Invalid email kind");
  return emailLayout(layout);
}
export async function sendEmailJob(
  job: EmailJob,
  config: { site: string; from: string; key: string; brand?: string },
  transport: typeof fetch = fetch,
) {
  const message = emailMessage(job, config.site, config.brand);
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
