"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AmountDisplay } from "@/components/shared/AmountDisplay";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { TransactionDrawer } from "./TransactionDrawer";
import { deleteTransaction } from "@/actions/transactions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: { toNumber(): number };
  description: string;
  date: Date;
  categoryId: string;
  notes: string | null;
  category: { id: string; name: string; icon?: string | null; color?: string | null };
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteTransaction(deleteTarget.id);
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                No transactions yet
              </TableCell>
            </TableRow>
          )}
          {transactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                {format(new Date(t.date), "dd MMM yyyy")}
              </TableCell>
              <TableCell className="font-medium max-w-[180px] truncate">{t.description}</TableCell>
              <TableCell>
                <CategoryBadge name={t.category.name} icon={t.category.icon} color={t.category.color} />
              </TableCell>
              <TableCell>
                <Badge variant={t.type === "INCOME" ? "default" : "secondary"} className={t.type === "INCOME" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                  {t.type === "INCOME" ? "Income" : "Expense"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <AmountDisplay amount={t.amount} type={t.type === "INCOME" ? "income" : "expense"} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditTarget(t)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(t)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TransactionDrawer
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        editing={editTarget}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete transaction?</DialogTitle>
            <DialogDescription>
              "{deleteTarget?.description}" on {deleteTarget && format(new Date(deleteTarget.date), "dd MMM yyyy")} will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
