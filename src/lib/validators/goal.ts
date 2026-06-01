import { z } from "zod";

export const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  targetAmount: z.coerce.number().positive("Target must be positive"),
  currentAmount: z.coerce.number().min(0).optional(),
  targetDate: z.coerce.date(),
  categoryId: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"]).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const goalContributionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
});

export type GoalInput = z.infer<typeof goalSchema>;
