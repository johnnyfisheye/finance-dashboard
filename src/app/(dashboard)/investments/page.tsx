"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { getInvestments, createInvestment, updateInvestment, deleteInvestment, recordSnapshot, getPortfolioHistory } from "@/actions/investments";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { ASSET_CLASS_LABELS, ASSET_CLASS_COLORS } from "@/lib/constants";
import { TrendingUp, TrendingDown, Briefcase, DollarSign } from "lucide-react";
import { format } from "date-fns";

type Investment = Awaited<ReturnType<typeof getInvestments>>[number];

const emptyForm = {
  name: "", ticker: "", assetClass: "STOCK" as string,
  quantity: "", costBasis: "", currentValue: "",
  purchaseDate: "", notes: "",
};

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [history, setHistory] = useState<{ date: string; value: number }[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Investment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isPending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      const [inv, hist] = await Promise.all([getInvestments(), getPortfolioHistory()]);
      setInvestments(inv);
      setHistory(hist);
    });
  }
  useEffect(() => { load(); }, []);

  const totalCost = investments.reduce((s, i) => s + i.costBasis.toNumber(), 0);
  const totalValue = investments.reduce((s, i) => s + i.currentValue.toNumber(), 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  // Allocation by asset class
  const byClass: Record<string, number> = {};
  for (const inv of investments) {
    byClass[inv.assetClass] = (byClass[inv.assetClass] ?? 0) + inv.currentValue.toNumber();
  }
  const allocationData = Object.entries(byClass).map(([cls, value]) => ({
    name: ASSET_CLASS_LABELS[cls] ?? cls,
    value,
    color: ASSET_CLASS_COLORS[cls] ?? "#94a3b8",
  }));

  function openEdit(inv: Investment) {
    setEditing(inv);
    setForm({
      name: inv.name, ticker: inv.ticker ?? "",
      assetClass: inv.assetClass,
      quantity: inv.quantity ? String(inv.quantity.toNumber()) : "",
      costBasis: String(inv.costBasis.toNumber()),
      currentValue: String(inv.currentValue.toNumber()),
      purchaseDate: inv.purchaseDate ? inv.purchaseDate.toISOString().slice(0, 10) : "",
      notes: inv.notes ?? "",
    });
    setSheetOpen(true);
  }

  function handleSave() {
    startTransition(async () => {
      const data = {
        ...form,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        costBasis: Number(form.costBasis),
        currentValue: Number(form.currentValue),
        purchaseDate: form.purchaseDate ? new Date(form.purchaseDate) : undefined,
      };
      if (editing) { await updateInvestment(editing.id, data); } else { await createInvestment(data); }
      setSheetOpen(false); load();
    });
  }

  return (
    <div>
      <DashboardHeader
        title="Investments"
        description="Track your long-term investment portfolio"
        action={
          <Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm); setSheetOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Investment
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Portfolio Value" value={formatCurrency(totalValue)} icon={Briefcase} status="default" />
        <KpiCard title="Total Invested" value={formatCurrency(totalCost)} icon={DollarSign} status="default" />
        <KpiCard title="Total P&L" value={formatCurrency(totalPnL)} icon={totalPnL >= 0 ? TrendingUp : TrendingDown} status={totalPnL >= 0 ? "positive" : "negative"} />
        <KpiCard title="P&L %" value={`${totalPnLPct >= 0 ? "+" : ""}${totalPnLPct.toFixed(2)}%`} icon={totalPnL >= 0 ? TrendingUp : TrendingDown} status={totalPnL >= 0 ? "positive" : "negative"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {history.length > 1 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">Portfolio Performance</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={history} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => format(new Date(d), "MMM")} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(v))} />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} name="Portfolio Value" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {allocationData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Allocation</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={allocationData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {allocationData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Cost Basis</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead className="text-right">P&L %</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No investments yet</TableCell></TableRow>
              )}
              {investments.map((inv) => {
                const cost = inv.costBasis.toNumber();
                const value = inv.currentValue.toNumber();
                const pnl = value - cost;
                const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                return (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div className="font-medium">{inv.name}</div>
                      {inv.ticker && <div className="text-xs text-muted-foreground">{inv.ticker}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs" style={{ backgroundColor: ASSET_CLASS_COLORS[inv.assetClass] + "20", color: ASSET_CLASS_COLORS[inv.assetClass] }}>
                        {ASSET_CLASS_LABELS[inv.assetClass]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(cost)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(value)}</TableCell>
                    <TableCell className={`text-right font-medium ${pnl >= 0 ? "text-green-600" : "text-destructive"}`}>{pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}</TableCell>
                    <TableCell className={`text-right text-sm ${pnl >= 0 ? "text-green-600" : "text-destructive"}`}>{pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Save snapshot" onClick={() => { startTransition(async () => { await recordSnapshot(inv.id); load(); }); }}>
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(inv)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(inv)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
          <SheetHeader><SheetTitle>{editing ? "Edit Investment" : "Add Investment"}</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. MSCI World ETF" />
              </div>
              <div className="space-y-1.5">
                <Label>Ticker (optional)</Label>
                <Input value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} placeholder="IWDA" />
              </div>
              <div className="space-y-1.5">
                <Label>Asset Class</Label>
                <Select value={form.assetClass} onValueChange={(v) => v !== null && setForm({ ...form, assetClass: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ASSET_CLASS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cost Basis (€)</Label>
                <Input type="number" step="0.01" value={form.costBasis} onChange={(e) => setForm({ ...form, costBasis: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Current Value (€)</Label>
                <Input type="number" step="0.01" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input type="number" step="0.00000001" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Purchase Date</Label>
                <Input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
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
            <DialogTitle>Remove investment?</DialogTitle>
            <DialogDescription>"{deleteTarget?.name}" will be archived (history preserved).</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { startTransition(async () => { await deleteInvestment(deleteTarget!.id); setDeleteTarget(null); load(); }); }} disabled={isPending}>{isPending ? "Removing…" : "Remove"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
