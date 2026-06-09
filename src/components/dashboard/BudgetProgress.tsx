import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { getAllocationData } from "@/actions/budgets";
import type { AllocationRules } from "@/lib/allocation";

type AllocationData = { income: number; totalSpend: number; totalInvested: number; actualSavings: number; targets: AllocationRules & { saveTarget: number; spendTarget: number; investTarget: number } };

function miniProgressColor(actual: number, target: number, invert: boolean) {
  const ratio = target > 0 ? actual / target : 0;
  if (invert) {
    return ratio >= 1 ? "[&>div]:bg-green-500" : ratio >= 0.8 ? "[&>div]:bg-amber-500" : "[&>div]:bg-destructive";
  }
  return ratio <= 0.9 ? "[&>div]:bg-green-500" : ratio <= 1 ? "[&>div]:bg-amber-500" : "[&>div]:bg-destructive";
}

function miniStatusColor(actual: number, target: number, invert: boolean) {
  const ratio = target > 0 ? actual / target : 0;
  if (invert) return ratio >= 1 ? "text-green-600" : ratio >= 0.8 ? "text-amber-500" : "text-destructive";
  return ratio <= 0.9 ? "text-green-600" : ratio <= 1 ? "text-amber-500" : "text-destructive";
}

function MiniRow({ label, actual, target, pct, invert = false }: { label: string; actual: number; target: number; pct: number; invert?: boolean }) {
  const p = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{label}</span>
          <span className="text-xs text-muted-foreground/60 bg-muted rounded px-1">{Math.round(pct * 100)}%</span>
        </div>
        <span className={cn("font-medium text-xs", miniStatusColor(actual, target, invert))}>
          {formatCurrency(actual)} <span className="text-muted-foreground font-normal">/ {formatCurrency(target)}</span>
        </span>
      </div>
      <Progress value={p} className={cn("h-1.5", miniProgressColor(actual, target, invert))} />
    </div>
  );
}

export function BudgetProgress({ allocation }: { allocation: AllocationData }) {
  if (allocation.income === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No income recorded this month
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 border-b">
        <span>Based on income</span>
        <span className="font-semibold text-foreground">{formatCurrency(allocation.income)}</span>
      </div>
      <MiniRow label="Save" actual={allocation.actualSavings} target={allocation.targets.saveTarget} pct={allocation.targets.saveRate} invert />
      <MiniRow label="Spend" actual={allocation.totalSpend} target={allocation.targets.spendTarget} pct={allocation.targets.spendRate} />
      <MiniRow label="Invest" actual={allocation.totalInvested} target={allocation.targets.investTarget} pct={allocation.targets.investRate} invert />
    </div>
  );
}
