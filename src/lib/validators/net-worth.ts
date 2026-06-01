import { z } from "zod";

export const netWorthItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  itemType: z.enum(["ASSET", "LIABILITY"]),
  subtype: z.string().min(1, "Subtype is required"),
  value: z.coerce.number().min(0, "Value must be non-negative"),
  notes: z.string().optional(),
});

export type NetWorthItemInput = z.infer<typeof netWorthItemSchema>;
