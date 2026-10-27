import { describe, it, expect, vi } from "vitest";
import {
  deliverEmailBatch,
  emailWorkerAuthorized,
} from "../../src/lib/email-worker";
import { emailMessage, type EmailJob } from "../../src/lib/email";

const job: EmailJob = {
  id: "d0c00000-0000-4000-8000-000000000010",
  lease: "d0c00000-0000-4000-8000-000000000011",
  kind: "order_status",
  recipient: "customer@example.invalid",
  payload: {
    orderId: "d0c00000-0000-4000-8000-000000000012",
    status: "pending",
  },
};
const config = {
  site: "https://store.example.invalid",
  from: "store@example.invalid",
  key: "fixture-key",
};

describe("protected notification delivery", () => {
  it("requires the exact bearer secret and fails closed when configuration is missing", () => {
    const secret = "fixture-worker-secret-not-for-production";
    const req = (auth?: string) =>
      new Request("https://store.example.invalid/api/internal/email-worker", {
        headers: auth ? { authorization: auth } : {},
      });
    expect(emailWorkerAuthorized(req(), secret)).toBe(false);
    expect(emailWorkerAuthorized(req(`Bearer ${secret}`))).toBe(false);
    expect(emailWorkerAuthorized(req(`Bearer ${secret}`), "short")).toBe(false);
    expect(emailWorkerAuthorized(req(`Bearer ${secret}-wrong`), secret)).toBe(
      false,
    );
    expect(emailWorkerAuthorized(req(`Bearer ${secret}`), secret)).toBe(true);
  });
  it("does not acknowledge provider rejection as delivery or leak its private body", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: [job], error: null })
      .mockResolvedValueOnce({ data: true, error: null });
    const send = vi
      .fn()
      .mockRejectedValue(new Error("private recipient and provider details"));
    expect(await deliverEmailBatch({ rpc }, config, send)).toEqual({
      sent: 0,
      failed: 1,
    });
    expect(rpc).toHaveBeenLastCalledWith("finish_email_job", {
      p_id: job.id,
      p_lease: job.lease,
      p_sent: false,
      p_error: "delivery_unconfirmed",
    });
  });
  it("stops after an uncertain acknowledgement instead of sending the next claimed job", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: [job, { ...job, id: job.lease }],
        error: null,
      })
      .mockResolvedValueOnce({ data: false, error: null });
    const send = vi.fn().mockResolvedValue(undefined);
    await expect(deliverEmailBatch({ rpc }, config, send)).rejects.toThrow(
      "acknowledgement",
    );
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("acknowledges the leased successful job and handles an empty queue without sending", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: [job], error: null })
      .mockResolvedValueOnce({ data: true, error: null });
    const send = vi.fn().mockResolvedValue(undefined);
    expect(await deliverEmailBatch({ rpc }, config, send)).toEqual({
      sent: 1,
      failed: 0,
    });
    expect(rpc).toHaveBeenLastCalledWith("finish_email_job", {
      p_id: job.id,
      p_lease: job.lease,
      p_sent: true,
      p_error: "",
    });
    send.mockClear();
    expect(
      await deliverEmailBatch(
        { rpc: vi.fn().mockResolvedValue({ data: [], error: null }) },
        config,
        send,
      ),
    ).toEqual({ sent: 0, failed: 0 });
    expect(send).not.toHaveBeenCalled();
  });
});

describe("runtime email designs", () => {
  it("renders all order states with private links, no invented totals and escaped branding", () => {
    const headings = [
      "Your order is in.",
      "Confirmed. Next, preparation.",
      "Handed to the courier.",
      "Delivery recorded.",
      "Your order was cancelled.",
    ];
    for (const [index, status] of [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ].entries()) {
      const message = emailMessage(
        { ...job, payload: { ...job.payload, status } },
        config.site,
        "Store <script>alert(1)</script>",
      );
      expect(message.html).toContain(headings[index]);
      expect(message.html).toContain("background:#111111");
      expect(message.html).toContain("&lt;script&gt;");
      expect(message.html).not.toContain("<script>");
      expect(message.html).not.toMatch(/\{\{|PKR|customer@example/);
      expect(message.text).toContain(`/account/orders/${job.payload.orderId}`);
    }
  });
  it("rejects unsafe origins, malformed IDs, unknown states and header-control characters", () => {
    for (const origin of [
      "javascript:alert(1)",
      "http://public.example.invalid",
      "https://user:pass@store.example.invalid",
    ])
      expect(() => emailMessage(job, origin)).toThrow();
    for (const status of ["__proto__", "constructor", "unknown"])
      expect(() =>
        emailMessage(
          { ...job, payload: { ...job.payload, status } },
          config.site,
        ),
      ).toThrow();
    expect(() =>
      emailMessage(
        { ...job, payload: { ...job.payload, orderId: "-".repeat(36) } },
        config.site,
      ),
    ).toThrow();
    expect(() => emailMessage(job, config.site, "Store\r\nInjected")).toThrow();
  });
});
