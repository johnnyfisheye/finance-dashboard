"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Search } from "lucide-react";
import { getTransactions, getCategories } from "@/actions/transactions";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionDrawer } from "@/components/transactions/TransactionDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

type TypeFilter = "ALL" | "INCOME" | "EXPENSE";

export default function TransactionsPage() {
  const [open, setOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [transactions, setTransactions] = useState<Awaited<ReturnType<typeof getTransactions>>["transactions"]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof getCategories>>>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      const result = await getTransactions({
        type: typeFilter === "ALL" ? undefined : typeFilter,
        categoryId: categoryFilter === "ALL" ? undefined : categoryFilter,
        search: search || undefined,
        pageSize: 100,
      });
      setTransactions(result.transactions);
      setTotal(result.total);
    });
  }

  useEffect(() => { getCategories().then(setCategories); }, []);
  useEffect(() => { load(); }, [typeFilter, categoryFilter, search]);

  return (
    <div>
      <DashboardHeader
        title="Transactions"
        description={`${total} transaction${total !== 1 ? "s" : ""} total`}
        action={
          <div className="flex gap-2">
            <Button onClick={() => { setDefaultType("INCOME"); setOpen(true); }} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Income
            </Button>
            <Button onClick={() => { setDefaultType("EXPENSE"); setOpen(true); }} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Expense
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => v !== null && setCategoryFilter(v)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isPending ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading…</div>
          ) : (
            <TransactionTable transactions={transactions} />
          )}
        </CardContent>
      </Card>

      <TransactionDrawer
        open={open}
        onClose={() => { setOpen(false); load(); }}
        defaultType={defaultType}
      />
    </div>
  );
}
