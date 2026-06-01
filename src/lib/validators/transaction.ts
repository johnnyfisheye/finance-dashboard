import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  date: z.coerce.date(),
  categoryId: z.string().min(1, "Category is required"),
  notes: z.string().optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
