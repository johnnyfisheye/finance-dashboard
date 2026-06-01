import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  name: string;
  icon?: string | null;
  color?: string | null;
  className?: string;
}

export function CategoryBadge({ name, icon, color, className }: CategoryBadgeProps) {
  const iconColor = color ?? "#94a3b8";

  // Safely get the Lucide icon by name
  const IconComponent =
    icon && icon in Icons
      ? (Icons[icon as keyof typeof Icons] as React.ComponentType<{ className?: string; style?: React.CSSProperties }>)
      : null;

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)}
    >
      {IconComponent && (
        <IconComponent
          className="w-3 h-3 shrink-0"
          style={{ color: iconColor }}
        />
      )}
      <span className="truncate">{name}</span>
    </span>
  );
}
