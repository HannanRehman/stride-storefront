import "server-only";
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
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Send a JSON request.");
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > 20000) {
      await reader.cancel();
      throw new Error("Request is too large.");
    }
    parts.push(part.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const data = JSON.parse(raw);
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("Invalid request.");
  return data as Record<string, unknown>;
}
