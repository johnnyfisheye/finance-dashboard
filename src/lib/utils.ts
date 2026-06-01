import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number | { toNumber(): number } | string | null | undefined,
  compact = false
): string {
  if (value === null || value === undefined) return "€0,00";
  const num =
    typeof value === "object" && "toNumber" in value
      ? value.toNumber()
      : Number(value);
  if (isNaN(num)) return "€0,00";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(num);
}

export function formatMonthYear(monthYear: string): string {
  const [year, month] = monthYear.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function getMonthYear(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function getPreviousMonths(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getMonthYear(d));
  }
  return months;
}

export function decimalToNumber(
  d: { toNumber(): number } | null | undefined
): number {
  if (d === null || d === undefined) return 0;
  return d.toNumber();
}
