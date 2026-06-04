"use client";

import { useEffect, useState, useTransition } from "react";
import { PiggyBank, TrendingUp, Wallet, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { getAllocationData, DEFAULT_ALLOCATION_RULES, type AllocationRules, type CategorySpend } from "@/actions/budgets";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency, getMonthYear, formatMonthYear } from "@/lib/utils";
import { cn } from "@/lib/utils";

const RULES_KEY = "allocation-rules";

type AllocationData = Awaited<ReturnType<typeof getAllocationData>>;

function pct(actual: number, target: number) {
  if (target <= 0) return 0;
  return Math.min((actual / target) * 100, 100);
}

function statusColor(actual: number, target: number, invert = false) {
  const ratio = target > 0 ? actual / target : 0;
  if (invert) {
    if (ratio >= 1) return "text-green-600";
    if (ratio >= 0.8) return "text-amber-500";
    return "text-destructive";
  } else {
    if (ratio <= 0.9) return "text-green-600";
    if (ratio <= 1) return "text-amber-500";
    return "text-destructive";
  }
}

function progressColor(actual: number, target: number, invert = false) {
  const ratio = target > 0 ? actual / target : 0;
  if (invert) {
    if (ratio >= 1) return "[&>div]:bg-green-500";
    if (ratio >= 0.8) return "[&>div]:bg-amber-500";
    return "[&>div]:bg-destructive";
  } else {
    if (ratio <= 0.9) return "[&>div]:bg-green-500";
    if (ratio <= 1) return "[&>div]:bg-amber-500";
    return "[&>div]:bg-destructive";
  }
}

function CategoryList({ items, income }: { items: CategorySpend[]; income: number }) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">No spending yet</p>;
  return (
    <div className="space-y-1 mt-2">
      {items.map((c) => (
        <div key={c.categoryId} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color ?? "#94a3b8" }} />
            <span className="truncate text-muted-foreground">{c.name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="font-medium">{formatCurrency(c.total)}</span>
            {income > 0 && (
              <span className="text-muted-foreground w-10 text-right">
                {((c.total / income) * 100).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AllocationCard({
  title,
  icon: Icon,
  actual,
  target,
  income,
  invert,
  children,
  targetLabel,
}: {
  title: string;
  icon: React.ElementType;
  actual: number;
  target: number;
  income: number;
  invert?: boolean;
  children?: React.ReactNode;
  targetLabel?: string;
}) {
  const p = pct(actual, target);
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <span className={cn("text-sm font-semibold", statusColor(actual, target, invert))}>
            {formatCurrency(actual)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={p} className={cn("h-2", progressColor(actual, target, invert))} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{targetLabel ?? `Target: ${formatCurrency(target)}`}</span>
          {income > 0 && target > 0 && (
            <span>{((target / income) * 100).toFixed(0)}% of income</span>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export default function BudgetsPage() {
  const [monthYear, setMonthYear] = useState(getMonthYear());
  const [rules, setRules] = useState<AllocationRules>(DEFAULT_ALLOCATION_RULES);
  const [data, setData] = useState<AllocationData | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RULES_KEY);
      if (saved) setRules(JSON.parse(saved));
    } catch {}
  }, []);

  function updateRules(next: AllocationRules) {
    setRules(next);
    try { localStorage.setItem(RULES_KEY, JSON.stringify(next)); } catch {}
  }

  function load() {
    startTransition(async () => {
      const d = await getAllocationData(monthYear, rules);
      setData(d);
    });
  }

  useEffect(() => { load(); }, [monthYear, rules]);

  const monthOptions = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2 + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const income = data?.income ?? 0;

  return (
    <div>
      <DashboardHeader
        title="Budget"
        description={`${formatMonthYear(monthYear)} — Income: ${formatCurrency(income)}`}
        action={
          <div className="flex items-center gap-2">
            <Select value={monthYear} onValueChange={(v) => v !== null && setMonthYear(v)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m} value={m}>{formatMonthYear(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setShowSettings((v) => !v)}>
              <Settings2 className="w-4 h-4 mr-1" />
              Rules
              {showSettings ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </Button>
          </div>
        }
      />

      {showSettings && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-3">Allocation Rules</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(["saveRate", "spendRate", "investRate"] as const).map((key) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs capitalize">{key.replace("Rate", " %")}</Label>
                  <Input
                    type="number" min={0} max={100} step={1}
                    value={Math.round(rules[key] * 100)}
                    onChange={(e) => updateRules({ ...rules, [key]: Number(e.target.value) / 100 })}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
              <div className="space-y-1">
                <Label className="text-xs">Invest Floor (€)</Label>
                <Input
                  type="number" min={0} step={50}
                  value={rules.investFloor}
                  onChange={(e) => updateRules({ ...rules, investFloor: Number(e.target.value) })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total: {Math.round((rules.saveRate + rules.spendRate + rules.investRate) * 100)}% — saved in your browser.
            </p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <AllocationCard
              title="Save"
              icon={PiggyBank}
              actual={data.actualSavings}
              target={data.targets.saveTarget}
              income={income}
              invert
              targetLabel={`Target: ${formatCurrency(data.targets.saveTarget)} (${Math.round(rules.saveRate * 100)}%)`}
            >
              <p className="text-xs text-muted-foreground">
                {data.actualSavings >= data.targets.saveTarget
                  ? `✓ ${formatCurrency(data.actualSavings - data.targets.saveTarget)} above target`
                  : `${formatCurrency(Math.abs(data.targets.saveTarget - data.actualSavings))} below target`}
              </p>
            </AllocationCard>

            <AllocationCard
              title="Spend"
              icon={Wallet}
              actual={data.totalSpend}
              target={data.targets.spendTarget}
              income={income}
              targetLabel={`Target: ${formatCurrency(data.targets.spendTarget)} (${Math.round(rules.spendRate * 100)}%)`}
            >
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Fixed / Cost of Living</span>
                  <span>{formatCurrency(data.totalFixed)}</span>
                </div>
                <CategoryList items={data.fixedCategories} income={income} />
                <div className="flex justify-between text-xs font-medium pt-1 border-t">
                  <span className="text-muted-foreground">Wants</span>
                  <span>{formatCurrency(data.totalWants)}</span>
                </div>
                <CategoryList items={data.wantsCategories} income={income} />
              </div>
            </AllocationCard>

            <AllocationCard
              title="Invest"
              icon={TrendingUp}
              actual={data.totalInvested}
              target={data.targets.investTarget}
              income={income}
              invert
              targetLabel={`Target: ${formatCurrency(data.targets.investTarget)} (${Math.round(rules.investRate * 100)}%, min €${rules.investFloor})`}
            >
              <p className="text-xs text-muted-foreground">
                Log contributions as expenses under{" "}
                <span className="font-medium text-foreground">Investment Contribution</span>.
              </p>
            </AllocationCard>
          </div>

          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-medium mb-3">Monthly Summary</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Income", value: income, color: "text-green-600" },
                  { label: "Spent", value: data.totalSpend, color: data.totalSpend > data.targets.spendTarget ? "text-destructive" : "text-foreground" },
                  { label: "Invested", value: data.totalInvested, color: "text-blue-600" },
                  { label: "Saved", value: data.actualSavings, color: data.actualSavings >= data.targets.saveTarget ? "text-green-600" : "text-destructive" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={cn("text-lg font-bold", color)}>{formatCurrency(value)}</p>
                    {income > 0 && <p className="text-xs text-muted-foreground">{((value / income) * 100).toFixed(1)}%</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {isPending && !data && (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
      )}
    </div>
  );
}
