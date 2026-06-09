"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { transactionSchema } from "@/lib/validators/transaction";
import { Prisma } from "@/generated/prisma/client";

export type TransactionFilters = {
  type?: "INCOME" | "EXPENSE";
  categoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function getTransactions(filters: TransactionFilters = {}) {
  const { type, categoryId, dateFrom, dateTo, search, page = 1, pageSize = 20 } = filters;
  const where: Prisma.TransactionWhereInput = {};
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = dateFrom;
    if (dateTo) where.date.lte = dateTo;
  }
  if (search) {
    where.description = { contains: search, mode: "insensitive" };
  }

  const [transactions, total] = await Promise.all([
    db.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.transaction.count({ where }),
  ]);

  return { transactions, total, page, pageSize };
}

export async function getRecentTransactions(limit = 10) {
  return db.transaction.findMany({
    include: { category: true },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function createTransaction(data: unknown) {
  const parsed = transactionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const { amount, ...rest } = parsed.data;
  await db.transaction.create({
    data: { ...rest, amount: new Prisma.Decimal(amount) },
  });
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateTransaction(id: string, data: unknown) {
  const parsed = transactionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const { amount, ...rest } = parsed.data;
  await db.transaction.update({
    where: { id },
    data: { ...rest, amount: new Prisma.Decimal(amount) },
  });
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteTransaction(id: string) {
  await db.transaction.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { success: true };
}

export async function getMonthlyTotals(months: string[]) {
  // Exclude investment-contribution categories from expense totals
  const investCats = await db.category.findMany({
    where: { isInvestment: true },
    select: { id: true },
  });
  const investIds = investCats.map((c) => c.id);

  const results = await Promise.all(
    months.map(async (monthYear) => {
      const [year, month] = monthYear.split("-").map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);

      const expenseWhere = {
        type: "EXPENSE" as const,
        date: { gte: start, lte: end },
        ...(investIds.length > 0 ? { categoryId: { notIn: investIds } } : {}),
      };

      const [incomeAgg, expenseAgg] = await Promise.all([
        db.transaction.aggregate({
          where: { type: "INCOME", date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        db.transaction.aggregate({
          where: expenseWhere,
          _sum: { amount: true },
        }),
      ]);

      const income = incomeAgg._sum.amount?.toNumber() ?? 0;
      const expense = expenseAgg._sum.amount?.toNumber() ?? 0;
      return { monthYear, income, expense, savings: income - expense };
    })
  );
  return results;
}

export async function getCategoryBreakdown(monthYear: string, excludeInvestments = false) {
  const [year, month] = monthYear.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  let excludeIds: string[] = [];
  if (excludeInvestments) {
    const investCats = await db.category.findMany({ where: { isInvestment: true }, select: { id: true } });
    excludeIds = investCats.map((c) => c.id);
  }

  const grouped = await db.transaction.groupBy({
    by: ["categoryId"],
    where: {
      type: "EXPENSE",
      date: { gte: start, lte: end },
      ...(excludeIds.length > 0 ? { categoryId: { notIn: excludeIds } } : {}),
    },
    _sum: { amount: true },
  });

  const categories = await db.category.findMany({
    where: { id: { in: grouped.map((g) => g.categoryId) } },
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return grouped.map((g: { categoryId: string; _sum: { amount: { toNumber(): number } | null } }) => ({
    categoryId: g.categoryId,
    name: catMap[g.categoryId]?.name ?? "Unknown",
    color: catMap[g.categoryId]?.color ?? "#94a3b8",
    icon: catMap[g.categoryId]?.icon ?? null,
    total: g._sum.amount?.toNumber() ?? 0,
  }));
}

export async function getCategories() {
  return db.category.findMany({ orderBy: { name: "asc" } });
}
