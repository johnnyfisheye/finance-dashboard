"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Pause, Play } from "lucide-react";
import { getRecurringItems, createRecurringItem, updateRecurringItem, deleteRecurringItem, toggleRecurringItem } from "@/actions/recurring";
import { getCategories } from "@/actions/transactions";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AmountDisplay } from "@/components/shared/AmountDisplay";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { formatCurrency, formatMonthYear } from "@/lib/utils";
import { FREQUENCY_LABELS } from "@/lib/constants";
import { format } from "date-fns";

type RecurringItem = Awaited<ReturnType<typeof getRecurringItems>>[number];
type Category = Awaited<ReturnType<typeof getCategories>>[number];

const emptyForm = {
  name: "", amount: "", type: "EXPENSE" as "INCOME" | "EXPENSE",
  categoryId: "", frequency: "MONTHLY" as string,
  dayOfMonth: "", startDate: new Date().toISOString().slice(0, 10),
  endDate: "", notes: "",
};

export default function RecurringPage() {
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isPending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      const [r, c] = await Promise.all([getRecurringItems(), getCategories()]);
      setItems(r);
      setCategories(c);
    });
  }

  useEffect(() => { load(); }, []);

  const filteredCats = categories.filter((c) => c.isIncome === (form.type === "INCOME"));

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setSheetOpen(true);
  }

  function openEdit(item: RecurringItem) {
    setEditing(item);
    setForm({
      name: item.name,
      amount: String(Number(item.amount)),
      type: item.type,
      categoryId: item.categoryId,
      frequency: item.frequency,
      dayOfMonth: item.dayOfMonth ? String(item.dayOfMonth) : "",
      startDate: item.startDate.toISOString().slice(0, 10),
      endDate: item.endDate ? item.endDate.toISOString().slice(0, 10) : "",
      notes: item.notes ?? "",
    });
    setSheetOpen(true);
  }

  function handleSave() {
    startTransition(async () => {
      const data = {
        ...form,
        amount: Number(form.amount),
        dayOfMonth: form.dayOfMonth ? Number(form.dayOfMonth) : undefined,
        startDate: new Date(form.startDate),
        endDate: form.endDate ? new Date(form.endDate) : undefined,
      };
      if (editing) {
        await updateRecurringItem(editing.id, data);
      } else {
        await createRecurringItem(data);
      }
      setSheetOpen(false);
      load();
    });
  }

  const totalMonthlyExpenses = items
    .filter((i) => i.isActive && i.type === "EXPENSE")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const totalMonthlyIncome = items
    .filter((i) => i.isActive && i.type === "INCOME")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div>
      <DashboardHeader
        title="Recurring"
        description={`${formatCurrency(totalMonthlyExpenses)}/mo in expenses · ${formatCurrency(totalMonthlyIncome)}/mo in income`}
        action={
          <Button size="sm" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1" /> Add Recurring
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">No recurring items yet</TableCell>
                </TableRow>
              )}
              {items.map((item) => {
                const cat = categories.find((c) => c.id === item.categoryId);
                return (
                  <TableRow key={item.id} className={!item.isActive ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{cat && <CategoryBadge name={cat.name} icon={cat.icon} color={cat.color} />}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{FREQUENCY_LABELS[item.frequency]}</TableCell>
                    <TableCell>
                      <Badge className={item.type === "INCOME" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                        {item.type === "INCOME" ? "Income" : "Expense"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <AmountDisplay amount={Number(item.amount)} type={item.type === "INCOME" ? "income" : "expense"} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? "default" : "secondary"} className="text-xs">
                        {item.isActive ? "Active" : "Paused"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { startTransition(async () => { await toggleRecurringItem(item.id, !item.isActive); load(); }); }}>
                          {item.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(item)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={(v) => !v && setSheetOpen(false)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>{editing ? "Edit Recurring" : "Add Recurring"}</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-4">
            {/* Type toggle */}
            <div className="flex rounded-lg border overflow-hidden">
              {(["EXPENSE", "INCOME"] as const).map((t) => (
                <button key={t} type="button"
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${form.type === t ? (t === "EXPENSE" ? "bg-destructive text-white" : "bg-green-600 text-white") : "bg-background hover:bg-muted"}`}
                  onClick={() => setForm({ ...form, type: t, categoryId: "" })}
                >
                  {t === "EXPENSE" ? "Expense" : "Income"}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Netflix" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (€)</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => v !== null && setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQUENCY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => v !== null && setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{filteredCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Day of Month</Label>
                <Input type="number" min="1" max="31" value={form.dayOfMonth} onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })} placeholder="e.g. 1" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave} disabled={isPending}>{isPending ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete recurring item?</DialogTitle>
            <DialogDescription>"{deleteTarget?.name}" will be removed. Past transactions will remain.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { startTransition(async () => { await deleteRecurringItem(deleteTarget!.id); setDeleteTarget(null); load(); }); }} disabled={isPending}>{isPending ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
