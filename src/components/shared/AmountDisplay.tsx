import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface AmountDisplayProps {
  amount: number | { toNumber(): number } | string;
  type?: "income" | "expense" | "neutral";
  className?: string;
  compact?: boolean;
  showSign?: boolean;
}

export function AmountDisplay({
  amount,
  type = "neutral",
  className,
  compact = false,
  showSign = false,
}: AmountDisplayProps) {
  const num = typeof amount === "object" && "toNumber" in amount
    ? amount.toNumber()
    : Number(amount);

  const formatted = formatCurrency(num, compact);
  const sign = showSign && num > 0 ? "+" : "";

  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        type === "income" && "text-green-600",
        type === "expense" && "text-destructive",
        type === "neutral" && "text-foreground",
        className
      )}
    >
      {sign}{formatted}
    </span>
  );
}
