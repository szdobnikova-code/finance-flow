import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return (
    "$" +
    new Intl.NumberFormat("en-GB", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)
  );
}

export function formatCurrencyAxis(value: number) {
  return (
    "$" +
    new Intl.NumberFormat("en-GB", {
      notation: "compact",
      maximumFractionDigits: 0,
    }).format(value)
  );
}
