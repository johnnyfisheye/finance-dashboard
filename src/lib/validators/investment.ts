import { z } from "zod";

export const investmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  ticker: z.string().optional(),
  assetClass: z.enum(["STOCK", "ETF", "CRYPTO", "REAL_ESTATE", "BONDS", "OTHER"]),
  quantity: z.coerce.number().optional(),
  costBasis: z.coerce.number().positive("Cost basis must be positive"),
  currentValue: z.coerce.number().min(0, "Current value must be non-negative"),
  purchaseDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export type InvestmentInput = z.infer<typeof investmentSchema>;
