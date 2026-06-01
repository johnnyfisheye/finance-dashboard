import { z } from "zod";

export const recurringSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().min(1, "Category is required"),
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  dayOfMonth: z.coerce.number().min(1).max(31).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export type RecurringInput = z.infer<typeof recurringSchema>;
