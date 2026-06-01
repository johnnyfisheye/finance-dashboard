import { Progress } from "@/components/ui/progress";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface BudgetItem {
  id: string;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
  category: { name: string; icon?: string | null; color?: string | null };
  limitAmount: { toNumber(): number };
}

export function BudgetProgress({ budgets }: { budgets: BudgetItem[] }) {
  if (budgets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No budgets set for this month
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {budgets.map((b) => {
        const pct = Math.min(b.percentage * 100, 100);
        return (
          <div key={b.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                {(b.isOverBudget || b.isNearLimit) && (
                  <AlertTriangle className={cn("w-3.5 h-3.5", b.isOverBudget ? "text-destructive" : "text-amber-500")} />
                )}
                <CategoryBadge name={b.category.name} icon={b.category.icon} color={b.category.color} />
              </div>
              <span className={cn("text-xs font-medium", b.isOverBudget ? "text-destructive" : "text-muted-foreground")}>
                {formatCurrency(b.spent)} / {formatCurrency(b.limitAmount.toNumber())}
              </span>
            </div>
            <Progress
              value={pct}
              className={cn("h-1.5", b.isOverBudget ? "[&>div]:bg-destructive" : b.isNearLimit ? "[&>div]:bg-amber-500" : "")}
            />
          </div>
        );
      })}
    </div>
  );
}
