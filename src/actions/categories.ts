"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#94a3b8"),
  icon: z.string().optional(),
  isIncome: z.boolean(),
});

export async function getCategories(type?: "INCOME" | "EXPENSE") {
  return db.category.findMany({
    where: type ? { isIncome: type === "INCOME" } : undefined,
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
}

export async function createCategory(data: unknown) {
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const existing = await db.category.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { error: { name: ["A category with this name already exists"] } };

  await db.category.create({
    data: { ...parsed.data, isSystem: false },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const category = await db.category.findUnique({ where: { id } });
  if (!category) return { error: "Category not found" };

  const [txCount, budgetCount, recurringCount] = await Promise.all([
    db.transaction.count({ where: { categoryId: id } }),
    db.budget.count({ where: { categoryId: id } }),
    db.recurringItem.count({ where: { categoryId: id } }),
  ]);

  const total = txCount + budgetCount + recurringCount;
  if (total > 0) {
    return {
      error: `Cannot delete: this category is used by ${txCount} transaction(s), ${budgetCount} budget(s), and ${recurringCount} recurring item(s).`,
    };
  }

  await db.category.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { success: true };
}
