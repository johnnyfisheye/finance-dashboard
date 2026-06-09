"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Camera } from "lucide-react";
import { getNetWorthItems, createNetWorthItem, updateNetWorthItem, deleteNetWorthItem, snapshotNetWorth, getNetWorthHistory } from "@/actions/net-worth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency, formatMonthYear } from "@/lib/utils";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

type NetWorthItem = Awaited<ReturnType<typeof getNetWorthItems>>[number];

const ASSET_SUBTYPES = ["Cash", "Investments", "Real Estate", "Vehicle", "Other Asset"];
const LIABILITY_SUBTYPES = ["Mortgage", "Car Loan", "Student Loan", "Credit Card", "Personal Loan", "Other Liability"];

const emptyForm = { name: "", itemType: "ASSET" as "ASSET" | "LIABILITY", subtype: "", value: "", notes: "" };

export default function NetWorthPage() {
  const [items, setItems] = useState<NetWorthItem[]>([]);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof getNetWorthHistory>>>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<NetWorthItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NetWorthItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isPending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      const [it, hist] = await Promise.all([getNetWorthItems(), getNetWorthHistory()]);
      setItems(it);
      setHistory(hist);
    });
  }
  useEffect(() => { load(); }, []);

  const assets = items.filter((i) => i.itemType === "ASSET");
  const liabilities = items.filter((i) => i.itemType === "LIABILITY");
  const totalAssets = assets.reduce((s, i) => s + Number(i.value), 0);
  const totalLiabilities = liabilities.reduce((s, i) => s + Number(i.value), 0);
  const netWorth = totalAssets - totalLiabilities;

  function openNew(type: "ASSET" | "LIABILITY") {
    setEditing(null); setForm({ ...emptyForm, itemType: type }); setSheetOpen(true);
  }
  function openEdit(item: NetWorthItem) {
    setEditing(item);
    setForm({ name: item.name, itemType: item.itemType, subtype: item.subtype, value: String(Number(item.value)), notes: item.notes ?? "" });
    setSheetOpen(true);
  }
  function handleSave() {
    startTransition(async () => {
      const data = { ...form, value: Number(form.value) };
      if (editing) { await updateNetWorthItem(editing.id, data); } else { await createNetWorthItem(data); }
      setSheetOpen(false); load();
    });
  }

  const subtypes = form.itemType === "ASSET" ? ASSET_SUBTYPES : LIABILITY_SUBTYPES;

  return (
    <div>
      <DashboardHeader
        title="Net Worth"
        description="Assets, liabilities and your overall financial health"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { startTransition(async () => { await snapshotNetWorth(); load(); }); }} disabled={isPending}>
              <Camera className="w-4 h-4 mr-1" /> Save Snapshot
            </Button>
            <Button size="sm" onClick={() => openNew("ASSET")}>
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard title="Total Assets" value={formatCurrency(totalAssets)} icon={TrendingUp} status="positive" />
        <KpiCard title="Total Liabilities" value={formatCurrency(totalLiabilities)} icon={TrendingDown} status="negative" />
        <KpiCard title="Net Worth" value={formatCurrency(netWorth)} icon={Wallet} status={netWorth >= 0 ? "positive" : "negative"} />
      </div>

      {history.length > 1 && (
        <Card className="mb-4">
          <CardHeader className="pb-2"><CardTitle className="text-base">Net Worth History</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={history} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="monthYear" tick={{ fontSize: 11 }} tickFormatter={(m) => formatMonthYear(m).split(" ")[0]} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(v))} labelFormatter={(label) => formatMonthYear(String(label))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="totalAssets" name="Assets" stroke="#22c55e" fill="#22c55e20" strokeWidth={2} />
                <Area type="monotone" dataKey="totalLiabilities" name="Liabilities" stroke="#ef4444" fill="#ef444420" strokeWidth={2} />
                <Area type="monotone" dataKey="netWorth" name="Net Worth" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Assets */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base text-green-600">Assets</CardTitle>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openNew("ASSET")}><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Value</TableHead><TableHead className="w-16" /></TableRow></TableHeader>
              <TableBody>
                {assets.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-sm">{a.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.subtype}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-green-600">{formatCurrency(Number(a.value))}</TableCell>
                    <TableCell><div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(a)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(a)}><Trash2 className="w-3 h-3" /></Button>
                    </div></TableCell>
                  </TableRow>
                ))}
                {assets.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">No assets</TableCell></TableRow>}
              </TableBody>
            </Table>
            <Separator />
            <div className="px-4 py-2 flex justify-between text-sm font-semibold">
              <span>Total Assets</span>
              <span className="text-green-600">{formatCurrency(totalAssets)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Liabilities */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base text-destructive">Liabilities</CardTitle>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openNew("LIABILITY")}><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Value</TableHead><TableHead className="w-16" /></TableRow></TableHeader>
              <TableBody>
                {liabilities.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium text-sm">{l.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.subtype}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-destructive">{formatCurrency(Number(l.value))}</TableCell>
                    <TableCell><div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(l)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(l)}><Trash2 className="w-3 h-3" /></Button>
                    </div></TableCell>
                  </TableRow>
                ))}
                {liabilities.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">No liabilities</TableCell></TableRow>}
              </TableBody>
            </Table>
            <Separator />
            <div className="px-4 py-2 flex justify-between text-sm font-semibold">
              <span>Total Liabilities</span>
              <span className="text-destructive">{formatCurrency(totalLiabilities)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form sheet */}
      <Sheet open={sheetOpen} onOpenChange={(v) => !v && setSheetOpen(false)}>
        <SheetContent className="sm:max-w-sm">
          <SheetHeader><SheetTitle>{editing ? "Edit Item" : form.itemType === "ASSET" ? "Add Asset" : "Add Liability"}</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="flex rounded-lg border overflow-hidden">
              {(["ASSET", "LIABILITY"] as const).map((t) => (
                <button key={t} type="button"
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${form.itemType === t ? (t === "ASSET" ? "bg-green-600 text-white" : "bg-destructive text-white") : "bg-background hover:bg-muted"}`}
                  onClick={() => setForm({ ...form, itemType: t, subtype: "" })}
                >
                  {t === "ASSET" ? "Asset" : "Liability"}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Savings Account" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.subtype} onValueChange={(v) => v !== null && setForm({ ...form, subtype: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{subtypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Value (€)</Label>
              <Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
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
            <DialogTitle>Delete item?</DialogTitle>
            <DialogDescription>"{deleteTarget?.name}" will be permanently deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { startTransition(async () => { await deleteNetWorthItem(deleteTarget!.id); setDeleteTarget(null); load(); }); }} disabled={isPending}>{isPending ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
