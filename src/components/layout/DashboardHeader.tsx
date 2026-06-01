import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function DashboardHeader({ title, description, action, className }: DashboardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
