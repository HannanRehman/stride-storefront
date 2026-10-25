export function safeNext(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  )
    return "/account";
  return /^\/admin(?:\/[^?#]*)?(?:\?[^#]*)?$/.test(value) ||
    value.startsWith("/account") ||
    value === "/cart" ||
    value === "/favorites" ||
    value === "/reset-password"
    ? value
    : "/account";
}
export function textField(
  value: unknown,
  label: string,
  min: number,
  max: number,
) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    throw new Error(`${label} must contain ${min}–${max} characters.`);
  return value.trim();
}
export function emailField(value: unknown) {
  const email = textField(value, "Email", 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter a valid email address.");
  return email;
}
export function passwordField(value: unknown) {
  if (typeof value !== "string" || value.length < 10 || value.length > 128)
    throw new Error("Use a password with 10–128 characters.");
  return value;
}
export function addressFields(data: Record<string, unknown>) {
  const phone = textField(data.phone, "Phone", 7, 30);
  if (!/^[+\d()\s-]+$/.test(phone))
    throw new Error("Enter a valid phone number.");
  const country = textField(data.country, "Country code", 2, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(country))
    throw new Error("Use a two-letter country code, such as PK.");
  return {
    label: textField(data.label, "Address label", 1, 40),
    recipient: textField(data.recipient, "Recipient", 1, 100),
    phone,
    line1: textField(data.line1, "Address", 1, 150),
    line2: textField(data.line2 ?? "", "Address line 2", 0, 150),
    city: textField(data.city, "City", 1, 80),
    province: textField(data.province, "Province / region", 1, 80),
    postal_code: textField(data.postal_code ?? "", "Postal code", 0, 20),
    country,
  };
}
