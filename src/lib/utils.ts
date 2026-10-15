import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function money(minor: number, currency: "USD" | "PKR" = "USD") {
  if (currency === "PKR")
    return `PKR ${new Intl.NumberFormat("en-PK", {
      maximumFractionDigits: minor % 100 ? 2 : 0,
    }).format(minor / 100)}`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: minor % 100 ? 2 : 0,
  }).format(minor / 100);
}
