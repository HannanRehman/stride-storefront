import { ownerClient } from "@/lib/admin-server";
import { orderFailure } from "@/lib/orders-server";
import { json } from "@/lib/account-http";
export async function GET() {
  try {
    const { client } = await ownerClient();
    const [orders, content, requests, queue] = await Promise.all([
      client
        .from("checkout_settings")
        .select("enabled,shipping_minor")
        .eq("id", true)
        .single(),
      client
        .from("site_content")
        .select("published,version,published_at")
        .eq("id", "home")
        .single(),
      client
        .from("support_requests")
        .select("id", { count: "exact", head: true })
        .neq("status", "resolved"),
      client
        .from("email_jobs")
        .select("id,kind,state,attempts,created_at,sent_at,last_error")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    return json({
      database: {
        checkout: !orders.error,
        content: !content.error,
        support: !requests.error,
        email: !queue.error,
      },
      checkout: orders.data,
      content: content.data,
      openRequests: requests.count,
      emailJobs: queue.data,
      services: {
        signupEmail: process.env.AUTH_EMAIL_ENABLED === "true",
        transactionalEmail:
          process.env.EMAIL_DELIVERY_ENABLED === "true" &&
          Boolean(
            process.env.EMAIL_WORKER_SECRET &&
            process.env.SUPABASE_SERVICE_ROLE_KEY &&
            process.env.RESEND_API_KEY &&
            process.env.EMAIL_FROM,
          ),
        canonicalConfigured: Boolean(
          process.env.NEXT_PUBLIC_SITE_URL &&
          !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost"),
        ),
        payments: "Cash on delivery",
        shipping: "Manual courier arrangement",
      },
    });
  } catch (e) {
    return orderFailure(e);
  }
}
