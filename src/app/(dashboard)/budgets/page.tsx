"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { getBudgetsWithSpending } from "@/actions/budgets";
import { deleteBudget, createBudget, updateBudget } from "@/actions/budgets";
import { getCategories } from "@/actions/transactions";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { formatCurrency, getMonthYear, formatMonthYear } from "@/lib/utils";
import { cn } from "@/lib/utils";

type BudgetWithSpending = Awaited<ReturnType<typeof getBudgetsWithSpending>>[number];
type Category = Awaited<ReturnType<typeof getCategories>>[number];

export default function BudgetsPage() {
  const [monthYear, setMonthYear] = useState(getMonthYear());
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetWithSpending | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetWithSpending | null>(null);
  const [form, setForm] = useState({ categoryId: "", limitAmount: "", alertAt: "0.8" });
  const [isPending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      const [b, c] = await Promise.all([getBudgetsWithSpending(monthYear), getCategories()]);
      setBudgets(b);
      setCategories(c.filter((c) => !c.isIncome));
    });
  }

  useEffect(() => { load(); }, [monthYear]);

  function openNew() {
    setEditing(null);
    setForm({ categoryId: "", limitAmount: "", alertAt: "0.8" });
    setSheetOpen(true);
  }

  function openEdit(b: BudgetWithSpending) {
    setEditing(b);
    setForm({ categoryId: b.categoryId, limitAmount: String(b.limitAmount.toNumber()), alertAt: String(b.alertAt?.toNumber() ?? 0.8) });
    setSheetOpen(true);
  }

  function handleSave() {
    startTransition(async () => {
      const data = { ...form, limitAmount: Number(form.limitAmount), alertAt: Number(form.alertAt), monthYear };
      if (editing) {
        await updateBudget(editing.id, data);
      } else {
        await createBudget(data);
      }
      setSheetOpen(false);
      load();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteBudget(deleteTarget.id);
      setDeleteTarget(null);
      load();
    });
  }

  const overBudget = budgets.filter((b) => b.isOverBudget);
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.limitAmount.toNumber(), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  // Build month options (current + 2 past + 2 future)
  const monthOptions = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2 + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  return (
    <div>
      <DashboardHeader
        title="Budgets"
        description={`${formatMonthYear(monthYear)} — ${formatCurrency(totalSpent)} of ${formatCurrency(totalBudgeted)} spent`}
        action={
          <div className="flex items-center gap-2">
            <Select value={monthYear} onValueChange={(v) => v !== null && setMonthYear(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m} value={m}>{formatMonthYear(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" /> Add Budget
            </Button>
          </div>
        }
      />

      {overBudget.length > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {overBudget.length} budget{overBudget.length > 1 ? "s" : ""} over limit:{" "}
          {overBudget.map((b) => b.category.name).join(", ")}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.map((b) => {
          const pct = Math.min(b.percentage * 100, 100);
          return (
            <Card key={b.id} className={cn(b.isOverBudget && "border-destructive/50")}>
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">
                  <CategoryBadge name={b.category.name} icon={b.category.icon} color={b.category.color} />
                </CardTitle>
                <div className="flex gap-1">
                  {b.isOverBudget && <Badge variant="destructive" className="text-xs">Over</Badge>}
                  {b.isNearLimit && !b.isOverBudget && <Badge className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">Near</Badge>}
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(b)}><Pencil className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(b)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={pct} className={cn("h-2", b.isOverBudget ? "[&>div]:bg-destructive" : b.isNearLimit ? "[&>div]:bg-amber-500" : "")} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Spent: {formatCurrency(b.spent)}</span>
                    <span className={cn(b.isOverBudget ? "text-destructive font-medium" : "")}>
                      {b.isOverBudget ? `Over by ${formatCurrency(Math.abs(b.remaining))}` : `${formatCurrency(b.remaining)} left`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Limit: {formatCurrency(b.limitAmount.toNumber())}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {budgets.length === 0 && (
          <div className="col-span-3 text-center py-16 text-muted-foreground text-sm">
            No budgets set for {formatMonthYear(monthYear)}.{" "}
            <button className="text-primary underline" onClick={openNew}>Add one</button>.
          </div>
        )}
      </div>

      {/* Budget form sheet */}
      <Sheet open={sheetOpen} onOpenChange={(v) => !v && setSheetOpen(false)}>
        <SheetContent className="sm:max-w-sm">
          <SheetHeader><SheetTitle>{editing ? "Edit Budget" : "Add Budget"}</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => v !== null && setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Monthly Limit (€)</Label>
              <Input type="number" step="0.01" value={form.limitAmount} onChange={(e) => setForm({ ...form, limitAmount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Alert at (%)</Label>
              <Input type="number" step="0.05" min="0" max="1" value={form.alertAt} onChange={(e) => setForm({ ...form, alertAt: e.target.value })} placeholder="0.8 = 80%" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave} disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete budget?</DialogTitle>
            <DialogDescription>The budget for "{deleteTarget?.category.name}" will be removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>{isPending ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
