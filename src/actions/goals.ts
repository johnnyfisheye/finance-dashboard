"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { goalSchema, goalContributionSchema } from "@/lib/validators/goal";
import { Prisma } from "@/generated/prisma";

export async function getGoals() {
  return db.goal.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createGoal(data: unknown) {
  const parsed = goalSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { targetAmount, currentAmount, ...rest } = parsed.data;
  await db.goal.create({
    data: {
      ...rest,
      targetAmount: new Prisma.Decimal(targetAmount),
      currentAmount: new Prisma.Decimal(currentAmount ?? 0),
    },
  });
  revalidatePath("/goals");
  return { success: true };
}

export async function updateGoal(id: string, data: unknown) {
  const parsed = goalSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { targetAmount, currentAmount, ...rest } = parsed.data;
  await db.goal.update({
    where: { id },
    data: {
      ...rest,
      targetAmount: new Prisma.Decimal(targetAmount),
      ...(currentAmount != null && { currentAmount: new Prisma.Decimal(currentAmount) }),
    },
  });
  revalidatePath("/goals");
  return { success: true };
}

export async function addGoalContribution(id: string, data: unknown) {
  const parsed = goalContributionSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const goal = await db.goal.findUnique({ where: { id } });
  if (!goal) return { error: "Goal not found" };

  const newAmount = goal.currentAmount.toNumber() + parsed.data.amount;
  const isComplete = newAmount >= goal.targetAmount.toNumber();

  await db.goal.update({
    where: { id },
    data: {
      currentAmount: new Prisma.Decimal(newAmount),
      ...(isComplete && { status: "COMPLETED" }),
    },
  });
  revalidatePath("/goals");
  return { success: true };
}

export async function deleteGoal(id: string) {
  await db.goal.delete({ where: { id } });
  revalidatePath("/goals");
  return { success: true };
}
