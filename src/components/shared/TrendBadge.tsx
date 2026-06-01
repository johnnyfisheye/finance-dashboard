import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendBadgeProps {
  value: number;
  className?: string;
  invertColors?: boolean;
}

export function TrendBadge({ value, className, invertColors = false }: TrendBadgeProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  const good = invertColors ? !isPositive : isPositive;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        isNeutral && "text-muted-foreground",
        !isNeutral && good && "text-green-600",
        !isNeutral && !good && "text-destructive",
        className
      )}
    >
      {isNeutral ? (
        <Minus className="w-3 h-3" />
      ) : isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {isNeutral ? "0%" : `${isPositive ? "+" : ""}${value.toFixed(1)}%`}
    </span>
  );
}
