import "server-only";
import { createHash } from "node:crypto";
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);
  const expected = `${requestUrl.protocol}//${request.headers.get("host") || requestUrl.host}`;
  if (
    !origin ||
    origin !== expected ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new Error("Request origin is not allowed.");
}
export async function body(request: Request) {
  assertSameOrigin(request);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new Error("Send a JSON request.");
  const raw = await request.text();
  if (raw.length > 20000) throw new Error("Request is too large.");
  const data = JSON.parse(raw);
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("Invalid request.");
  return data as Record<string, unknown>;
}
// Additional per-instance throttle; Supabase Auth enforces provider-side limits.
const attempts = new Map<string, { count: number; until: number }>();
export function allowAuth(request: Request, action: string, email: string) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = createHash("sha256")
    .update(`${ip}:${action}:${email}`)
    .digest("hex");
  const now = Date.now();
  for (const [id, value] of attempts)
    if (value.until < now) attempts.delete(id);
  if (attempts.size > 10000) return false;
  const value = attempts.get(key) || { count: 0, until: now + 600000 };
  value.count += 1;
  attempts.set(key, value);
  return value.count <= 8;
}
