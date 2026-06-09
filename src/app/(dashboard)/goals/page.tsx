"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, PlusCircle } from "lucide-react";
import { getGoals, createGoal, updateGoal, deleteGoal, addGoalContribution } from "@/actions/goals";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { GOAL_STATUS_LABELS } from "@/lib/constants";
import { format, differenceInDays } from "date-fns";

type Goal = Awaited<ReturnType<typeof getGoals>>[number];

const emptyForm = {
  name: "", description: "", targetAmount: "", currentAmount: "0",
  targetDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  status: "ACTIVE" as string, color: "#3b82f6", icon: "Target",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);
  const [contributeTarget, setContributeTarget] = useState<Goal | null>(null);
  const [contribution, setContribution] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [isPending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      setGoals(await getGoals());
    });
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm(emptyForm); setSheetOpen(true); }
  function openEdit(g: Goal) {
    setEditing(g);
    setForm({
      name: g.name, description: g.description ?? "",
      targetAmount: String(Number(g.targetAmount)),
      currentAmount: String(Number(g.currentAmount)),
      targetDate: g.targetDate.toISOString().slice(0, 10),
      status: g.status, color: g.color ?? "#3b82f6", icon: g.icon ?? "Target",
    });
    setSheetOpen(true);
  }

  function handleSave() {
    startTransition(async () => {
      const data = { ...form, targetAmount: Number(form.targetAmount), currentAmount: Number(form.currentAmount), targetDate: new Date(form.targetDate) };
      if (editing) { await updateGoal(editing.id, data); } else { await createGoal(data); }
      setSheetOpen(false); load();
    });
  }

  function handleContribute() {
    if (!contributeTarget) return;
    startTransition(async () => {
      await addGoalContribution(contributeTarget.id, { amount: Number(contribution) });
      setContributeTarget(null); setContribution(""); load();
    });
  }

  const active = goals.filter((g) => g.status === "ACTIVE");
  const completed = goals.filter((g) => g.status === "COMPLETED");

  return (
    <div>
      <DashboardHeader
        title="Goals"
        description={`${active.length} active · ${completed.length} completed`}
        action={<Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Add Goal</Button>}
      />

      {goals.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No goals yet. <button className="text-primary underline" onClick={openNew}>Create one</button>.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((g) => {
          const target = Number(g.targetAmount);
          const current = Number(g.currentAmount);
          const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
          const daysLeft = differenceInDays(new Date(g.targetDate), new Date());

          return (
            <Card key={g.id}>
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: g.color ?? "#3b82f6" }} />
                  <CardTitle className="text-sm font-semibold truncate">{g.name}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={g.status === "COMPLETED" ? "default" : "secondary"} className={`text-xs ${g.status === "COMPLETED" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}`}>
                    {GOAL_STATUS_LABELS[g.status]}
                  </Badge>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(g)}><Pencil className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(g)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{formatCurrency(current)}</span>
                    <span className="text-muted-foreground">of {formatCurrency(target)}</span>
                  </div>
                  <Progress value={pct} className="h-2" style={{ "--progress-color": g.color ?? "#3b82f6" } as React.CSSProperties} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{pct.toFixed(0)}% complete</span>
                    <span>{daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? "Due today" : "Overdue"}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Target: {format(new Date(g.targetDate), "dd MMM yyyy")}</div>
                {g.status === "ACTIVE" && (
                  <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs h-7" onClick={() => setContributeTarget(g)}>
                    <PlusCircle className="w-3.5 h-3.5" /> Add Contribution
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Goal form sheet */}
      <Sheet open={sheetOpen} onOpenChange={(v) => !v && setSheetOpen(false)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>{editing ? "Edit Goal" : "New Goal"}</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Goal name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Emergency Fund" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional notes…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Target Amount (€)</Label>
                <Input type="number" step="0.01" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Current Amount (€)</Label>
                <Input type="number" step="0.01" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Target Date</Label>
              <Input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-9 h-9 rounded border cursor-pointer" />
                <span className="text-sm text-muted-foreground">{form.color}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave} disabled={isPending}>{isPending ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Contribution dialog */}
      <Dialog open={!!contributeTarget} onOpenChange={(v) => !v && setContributeTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
            <DialogDescription>Add to "{contributeTarget?.name}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Amount (€)</Label>
            <Input type="number" step="0.01" value={contribution} onChange={(e) => setContribution(e.target.value)} placeholder="0.00" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContributeTarget(null)}>Cancel</Button>
            <Button onClick={handleContribute} disabled={isPending || !contribution}>{isPending ? "Adding…" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete goal?</DialogTitle>
            <DialogDescription>"{deleteTarget?.name}" will be permanently deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { startTransition(async () => { await deleteGoal(deleteTarget!.id); setDeleteTarget(null); load(); }); }} disabled={isPending}>{isPending ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
