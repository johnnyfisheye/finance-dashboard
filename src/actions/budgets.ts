"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { budgetSchema } from "@/lib/validators/budget";
import { Prisma } from "@/generated/prisma/client";
import { DEFAULT_ALLOCATION_RULES, type AllocationRules, type CategorySpend } from "@/lib/allocation";

export type { AllocationRules, CategorySpend };

export async function getAllocationData(monthYear: string, rules: AllocationRules = DEFAULT_ALLOCATION_RULES) {
  const [year, month] = monthYear.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const [incomeAgg, expenseGroups, expenseCategories] = await Promise.all([
    db.transaction.aggregate({
      where: { type: "INCOME", date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["categoryId"],
      where: { type: "EXPENSE", date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    db.category.findMany({ where: { isIncome: false } }),
  ]);

  const income = incomeAgg._sum.amount?.toNumber() ?? 0;
  const catMap = Object.fromEntries(expenseCategories.map((c) => [c.id, c]));

  const fixedCategories: CategorySpend[] = [];
  const wantsCategories: CategorySpend[] = [];
  let totalInvested = 0;

  for (const g of expenseGroups) {
    const cat = catMap[g.categoryId];
    if (!cat) continue;
    const total = g._sum.amount?.toNumber() ?? 0;
    const entry: CategorySpend = {
      categoryId: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      isFixed: cat.isFixed,
      isInvestment: cat.isInvestment,
      total,
    };
    if (cat.isInvestment) {
      totalInvested += total;
    } else if (cat.isFixed) {
      fixedCategories.push(entry);
    } else {
      wantsCategories.push(entry);
    }
  }

  fixedCategories.sort((a, b) => b.total - a.total);
  wantsCategories.sort((a, b) => b.total - a.total);

  const totalFixed = fixedCategories.reduce((s, c) => s + c.total, 0);
  const totalWants = wantsCategories.reduce((s, c) => s + c.total, 0);
  const totalSpend = totalFixed + totalWants;
  const actualSavings = income - totalSpend - totalInvested;

  const saveTarget = income * rules.saveRate;
  const spendTarget = income * rules.spendRate;
  const investTarget = Math.max(rules.investFloor, income * rules.investRate);

  return {
    monthYear,
    income,
    totalFixed,
    totalWants,
    totalSpend,
    totalInvested,
    actualSavings,
    targets: { ...rules, saveTarget, spendTarget, investTarget },
    fixedCategories,
    wantsCategories,
  };
}

export async function getBudgets(monthYear: string) {
  return db.budget.findMany({
    where: { monthYear },
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  });
}

export async function getBudgetsWithSpending(monthYear: string) {
  const budgets = await db.budget.findMany({
    where: { monthYear },
    include: { category: true },
  });

  const [year, month] = monthYear.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const spending = await db.transaction.groupBy({
    by: ["categoryId"],
    where: { type: "EXPENSE", date: { gte: start, lte: end } },
    _sum: { amount: true },
  });

  const spendingMap = Object.fromEntries(
    spending.map((s: { categoryId: string; _sum: { amount: { toNumber(): number } | null } }) => [
      s.categoryId,
      s._sum.amount?.toNumber() ?? 0,
    ])
  );

  return budgets.map((b) => {
    const spent = spendingMap[b.categoryId] ?? 0;
    const limit = b.limitAmount.toNumber();
    const alertAt = b.alertAt?.toNumber() ?? 0.8;
    return {
      ...b,
      spent,
      remaining: limit - spent,
      percentage: limit > 0 ? spent / limit : 0,
      isOverBudget: spent > limit,
      isNearLimit: spent / limit >= alertAt && spent <= limit,
    };
  });
}

export async function createBudget(data: unknown) {
  const parsed = budgetSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { limitAmount, alertAt, ...rest } = parsed.data;
  await db.budget.upsert({
    where: { categoryId_monthYear: { categoryId: rest.categoryId, monthYear: rest.monthYear } },
    update: { limitAmount: new Prisma.Decimal(limitAmount), alertAt: alertAt != null ? new Prisma.Decimal(alertAt) : null },
    create: {
      ...rest,
      limitAmount: new Prisma.Decimal(limitAmount),
      alertAt: alertAt != null ? new Prisma.Decimal(alertAt) : null,
    },
  });

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateBudget(id: string, data: unknown) {
  const parsed = budgetSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { limitAmount, alertAt, ...rest } = parsed.data;
  await db.budget.update({
    where: { id },
    data: {
      ...rest,
      limitAmount: new Prisma.Decimal(limitAmount),
      alertAt: alertAt != null ? new Prisma.Decimal(alertAt) : null,
    },
  });
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteBudget(id: string) {
  await db.budget.delete({ where: { id } });
  revalidatePath("/budgets");
  return { success: true };
}
