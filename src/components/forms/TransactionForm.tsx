"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { transactionSchema } from "@/lib/validators/transaction";
import { getCategories } from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type FormData = z.output<typeof transactionSchema>;

interface Category {
  id: string;
  name: string;
  isIncome: boolean;
}

interface TransactionFormProps {
  defaultType?: "INCOME" | "EXPENSE";
  defaultValues?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<{ success?: boolean; error?: unknown }>;
  onClose: () => void;
}

export function TransactionForm({ defaultType = "EXPENSE", defaultValues, onSubmit, onClose }: TransactionFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(transactionSchema) as Resolver<FormData>,
    defaultValues: {
      type: defaultType,
      date: new Date(),
      ...defaultValues,
    },
  });

  const type = watch("type");
  const date = watch("date");
  const categoryId = watch("categoryId");
  const filteredCategories = categories.filter((c) => c.isIncome === (type === "INCOME"));

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats);
      // If editing, ensure the categoryId is in the filtered list; if not (e.g. type mismatch), clear it
      const currentCategoryId = watch("categoryId");
      if (currentCategoryId) {
        const match = cats.find((c) => c.id === currentCategoryId);
        if (match && match.isIncome !== (watch("type") === "INCOME")) {
          setValue("categoryId", "");
        }
      }
    });
  }, []);

  function submit(data: FormData) {
    startTransition(async () => {
      const result = await onSubmit(data);
      if (result?.success) onClose();
    });
  }

  return (
    <form onSubmit={handleSubmit(submit as Parameters<typeof handleSubmit>[0])} className="space-y-4">
      {/* Type toggle */}
      <div className="flex rounded-lg border overflow-hidden">
        {(["EXPENSE", "INCOME"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={cn(
              "flex-1 py-2 text-sm font-medium transition-colors",
              type === t
                ? t === "EXPENSE"
                  ? "bg-destructive text-white"
                  : "bg-green-600 text-white"
                : "bg-background hover:bg-muted"
            )}
            onClick={() => {
              setValue("type", t);
              setValue("categoryId", "");
            }}
          >
            {t === "EXPENSE" ? "Expense" : "Income"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Description</Label>
          <Input {...register("description")} placeholder="e.g. Supermarket" />
          {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Amount (€)</Label>
          <Input {...register("amount")} type="number" step="0.01" placeholder="0.00" />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger className={cn("flex h-9 w-full items-center justify-start gap-2 rounded-md border bg-background px-3 py-2 text-sm font-normal", !date && "text-muted-foreground")}>
              <CalendarIcon className="h-4 w-4 shrink-0" />
              {date ? format(date, "dd/MM/yyyy") : "Pick date"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setValue("date", d)}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Category</Label>
          <Select
            value={categoryId ?? ""}
            onValueChange={(v) => v !== null && setValue("categoryId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Notes (optional)</Label>
          <Textarea {...register("notes")} placeholder="Any additional notes…" rows={2} />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
