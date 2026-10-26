export type OrderStatus =
  "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export const orderStatuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];
export const orderTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
export const statusLabel = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);
export type CheckoutItem = {
  productId: string;
  size: string;
  quantity: number;
};
export type DeliveryAddress = {
  recipient: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postal_code: string;
  country: "PK";
};
export type QuoteLine = CheckoutItem & {
  slug: string;
  name: string;
  color: string;
  unit_minor: number;
  line_minor: number;
};
export type OrderQuote = {
  items: QuoteLine[];
  currency: "PKR";
  subtotal_minor: number;
  shipping_minor: number;
  total_minor: number;
};
export type StoreOrder = {
  id: string;
  status: OrderStatus;
  payment_status: "unpaid" | "collected";
  payment_method: "cod";
  currency: "PKR";
  items: QuoteLine[];
  address: DeliveryAddress;
  subtotal_minor: number;
  shipping_minor: number;
  total_minor: number;
  courier: string;
  tracking_reference: string;
  created_at: string;
  updated_at: string;
};
export type OrderEvent = {
  id: string;
  status: OrderStatus;
  created_at: string;
};
export type CheckoutSettings = {
  enabled: boolean;
  shipping_minor: number;
  updated_at: string;
};
export class OrderError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code?: string,
  ) {
    super(message);
  }
}
export function checkoutItems(value: unknown): CheckoutItem[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20)
    throw new OrderError("Checkout needs between 1 and 20 bag items.");
  const lines = value.map((item) => {
    if (
      !item ||
      typeof item.productId !== "string" ||
      !item.productId ||
      item.productId.length > 100 ||
      typeof item.size !== "string" ||
      !item.size ||
      item.size.length > 16 ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 10
    )
      throw new OrderError(
        "Choose a valid size and a quantity from 1 to 10 for each item.",
      );
    return {
      productId: item.productId,
      size: item.size,
      quantity: item.quantity,
    };
  });
  if (
    new Set(lines.map((i) => JSON.stringify([i.productId, i.size]))).size !==
    lines.length
  )
    throw new OrderError(
      "Combine duplicate sizes in your bag before checkout.",
    );
  return lines.sort(
    (a, b) =>
      a.productId.localeCompare(b.productId) || a.size.localeCompare(b.size),
  );
}
function field(value: unknown, label: string, max: number, optional = false) {
  if (
    typeof value !== "string" ||
    (!optional && !value.trim()) ||
    value.trim().length > max ||
    /[\u0000-\u001f\u007f]/.test(value)
  )
    throw new OrderError(
      `Enter a valid ${label.toLowerCase()}${optional ? " or leave it blank" : ""}.`,
    );
  return value.trim();
}
export function deliveryAddress(value: unknown): DeliveryAddress {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new OrderError("Add your delivery address.");
  const data = value as Record<string, unknown>;
  let phone = field(data.phone, "Phone number", 30).replace(/[\s()-]/g, "");
  if (phone.startsWith("+92")) phone = `0${phone.slice(3)}`;
  if (!/^03\d{9}$/.test(phone))
    throw new OrderError(
      "Enter a Pakistani mobile number, such as 03001234567.",
    );
  const postal = field(data.postal_code ?? "", "Postal code", 5, true);
  if (postal && !/^\d{5}$/.test(postal))
    throw new OrderError("Enter a five-digit postal code or leave it blank.");
  if (data.country !== "PK")
    throw new OrderError(
      "Delivery is currently available within Pakistan only.",
    );
  return {
    recipient: field(data.recipient, "Recipient name", 100),
    phone,
    line1: field(data.line1, "Street address", 150),
    line2: field(data.line2 ?? "", "Address line 2", 150, true),
    city: field(data.city, "City", 80),
    province: field(data.province, "Province or region", 80),
    postal_code: postal,
    country: "PK",
  };
}
export function uuid(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      value,
    )
  )
    throw new OrderError("Reload this page before continuing.");
  return value;
}
export function orderReference(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}
export function orderDate(value: string) {
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(new Date(value));
}
