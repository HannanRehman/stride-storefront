export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
export function siteBase(
  value = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
) {
  return new URL(value).origin;
}
