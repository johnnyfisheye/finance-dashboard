"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { investmentSchema } from "@/lib/validators/investment";
import { Prisma } from "@/generated/prisma";

export async function getInvestments() {
  return db.investment.findMany({
    where: { isActive: true },
    include: { snapshots: { orderBy: { date: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export async function createInvestment(data: unknown) {
  const parsed = investmentSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { costBasis, currentValue, quantity, ...rest } = parsed.data;
  await db.investment.create({
    data: {
      ...rest,
      costBasis: new Prisma.Decimal(costBasis),
      currentValue: new Prisma.Decimal(currentValue),
      ...(quantity != null && { quantity: new Prisma.Decimal(quantity) }),
    },
  });
  revalidatePath("/investments");
  return { success: true };
}

export async function updateInvestment(id: string, data: unknown) {
  const parsed = investmentSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { costBasis, currentValue, quantity, ...rest } = parsed.data;
  await db.investment.update({
    where: { id },
    data: {
      ...rest,
      costBasis: new Prisma.Decimal(costBasis),
      currentValue: new Prisma.Decimal(currentValue),
      ...(quantity != null && { quantity: new Prisma.Decimal(quantity) }),
    },
  });
  revalidatePath("/investments");
  return { success: true };
}

export async function deleteInvestment(id: string) {
  await db.investment.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/investments");
  return { success: true };
}

export async function recordSnapshot(investmentId: string) {
  const investment = await db.investment.findUnique({ where: { id: investmentId } });
  if (!investment) return { error: "Investment not found" };

  await db.investmentSnapshot.create({
    data: { investmentId, date: new Date(), value: investment.currentValue },
  });
  revalidatePath("/investments");
  return { success: true };
}

export async function getPortfolioHistory() {
  const snapshots = await db.investmentSnapshot.findMany({
    orderBy: { date: "asc" },
  });

  // Group by date (YYYY-MM-DD) and sum values
  const byDate = new Map<string, number>();
  for (const s of snapshots) {
    const key = s.date.toISOString().slice(0, 10);
    byDate.set(key, (byDate.get(key) ?? 0) + s.value.toNumber());
  }

  return Array.from(byDate.entries()).map(([date, value]) => ({ date, value }));
}
