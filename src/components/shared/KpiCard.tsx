import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Status = "default" | "positive" | "warning" | "negative";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  status?: Status;
  trend?: { value: number; label?: string };
}

const statusColors: Record<Status, string> = {
  default: "text-muted-foreground",
  positive: "text-green-600",
  warning: "text-amber-600",
  negative: "text-destructive",
};

const statusIconBg: Record<Status, string> = {
  default: "bg-muted text-muted-foreground",
  positive: "bg-green-100 text-green-600",
  warning: "bg-amber-100 text-amber-600",
  negative: "bg-red-100 text-destructive",
};

export function KpiCard({ title, value, subtitle, icon: Icon, status = "default", trend }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className={cn("text-2xl font-bold tracking-tight", statusColors[status])}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <p className="text-xs text-muted-foreground">
                {trend.value >= 0 ? "+" : ""}
                {trend.value.toFixed(1)}% {trend.label ?? "vs last month"}
              </p>
            )}
          </div>
          <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg shrink-0", statusIconBg[status])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
