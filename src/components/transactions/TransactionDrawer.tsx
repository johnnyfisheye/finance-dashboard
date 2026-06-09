"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { createTransaction, updateTransaction } from "@/actions/transactions";
import { z } from "zod";
import { transactionSchema } from "@/lib/validators/transaction";

type FormData = z.infer<typeof transactionSchema>;

interface ExistingTransaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: { toNumber(): number } | number | string;
  description: string;
  date: Date | string;
  categoryId: string;
  notes: string | null;
}

interface TransactionDrawerProps {
  open: boolean;
  onClose: () => void;
  defaultType?: "INCOME" | "EXPENSE";
  editing?: ExistingTransaction | null;
}

export function TransactionDrawer({ open, onClose, defaultType = "EXPENSE", editing }: TransactionDrawerProps) {
  async function handleSubmit(data: FormData) {
    if (editing) {
      return updateTransaction(editing.id, data);
    }
    return createTransaction(data);
  }

  const defaultValues: Partial<FormData> | undefined = editing
    ? {
        type: editing.type,
        amount: typeof editing.amount === "object" && editing.amount !== null && "toNumber" in editing.amount
          ? editing.amount.toNumber()
          : Number(editing.amount),
        description: editing.description,
        date: new Date(editing.date),
        categoryId: editing.categoryId,
        notes: editing.notes ?? undefined,
      }
    : undefined;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit Transaction" : "Add Transaction"}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <TransactionForm
            key={editing?.id ?? "new"}
            defaultType={defaultType}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            onClose={onClose}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
