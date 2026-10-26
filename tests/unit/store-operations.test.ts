import { describe, it, expect, vi } from "vitest";
import {
  contentInput,
  defaultContent,
  contentHref,
} from "../../src/lib/site-content";
import { emailMessage, sendEmailJob, type EmailJob } from "../../src/lib/email";
describe("store content safety", () => {
  it("allows owned images and store destinations, not arbitrary URLs or script destinations", () => {
    expect(contentInput(defaultContent, "https://test.supabase.co")).toEqual(
      defaultContent,
    );
    for (const href of [
      "https://evil.invalid",
      "//evil.invalid",
      "javascript:alert(1)",
      "/admin",
      "/shop/all%2fevil",
      "/shop/all?next=%0aevil",
    ]) {
      expect(contentHref(href)).toBe(false);
      expect(() =>
        contentInput(
          { ...defaultContent, heroHref: href },
          "https://test.supabase.co",
        ),
      ).toThrow();
    }
    expect(() =>
      contentInput(
        { ...defaultContent, heroImage: "https://evil.invalid/photo.webp" },
        "https://test.supabase.co",
      ),
    ).toThrow();
    expect(() =>
      contentInput(
        { ...defaultContent, supportEmail: "not-an-email" },
        "https://test.supabase.co",
      ),
    ).toThrow();
  });
  it("bounds plain content and does not trust extra fields", () => {
    expect(() =>
      contentInput(
        { ...defaultContent, heroLine1: "x".repeat(51) },
        "https://test.supabase.co",
      ),
    ).toThrow();
    expect(
      contentInput(
        { ...defaultContent, version: 999, owner: true },
        "https://test.supabase.co",
      ),
    ).not.toHaveProperty("owner");
  });
});
describe("transactional email without live delivery", () => {
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
  it("links to private account details and does not include delivery PII", () => {
    const m = emailMessage(job, "https://store.example.invalid");
    expect(m.text).toContain("awaiting store confirmation");
    expect(m.html).toContain("/account/orders/");
    expect(m.html).not.toContain(job.recipient);
    expect(() =>
      emailMessage(
        { ...job, payload: { ...job.payload, status: "<script>" } },
        "https://store.example.invalid",
      ),
    ).toThrow();
  });
  it("uses a stable provider idempotency key and hides provider recipient errors", async () => {
    const transport = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    await sendEmailJob(
      job,
      {
        site: "https://store.example.invalid",
        from: "Store <store@example.invalid>",
        key: "test-key",
      },
      transport,
    );
    expect(transport).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Idempotency-Key": `store-email/${job.id}`,
        }),
      }),
    );
    const failed = vi
      .fn()
      .mockResolvedValue(
        new Response('{"private":"recipient details"}', { status: 429 }),
      );
    await expect(
      sendEmailJob(
        job,
        {
          site: "https://store.example.invalid",
          from: "store@example.invalid",
          key: "test",
        },
        failed,
      ),
    ).rejects.toThrow("provider_http_429");
  });
  it("launch confirmations include separate confirmation and unsubscribe actions", () => {
    const message = emailMessage(
      {
        ...job,
        kind: "launch_confirmation",
        payload: { confirmationToken: job.id, unsubscribeToken: job.lease },
      },
      "https://store.example.invalid",
    );
    expect(message.text).toContain("action=confirm");
    expect(message.text).toContain("action=unsubscribe");
  });
});
