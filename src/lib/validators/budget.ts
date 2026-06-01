import { z } from "zod";

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM format"),
  limitAmount: z.coerce.number().positive("Limit must be positive"),
  alertAt: z.coerce.number().min(0).max(1).optional(),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
