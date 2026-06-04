"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { recurringSchema } from "@/lib/validators/recurring";
import { Prisma } from "@/generated/prisma/client";
import { addWeeks, addMonths, addQuarters, addYears, isBefore, startOfDay } from "date-fns";

export async function getRecurringItems() {
  return db.recurringItem.findMany({ orderBy: { name: "asc" } });
}

export async function createRecurringItem(data: unknown) {
  const parsed = recurringSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { amount, ...rest } = parsed.data;
  await db.recurringItem.create({
    data: { ...rest, amount: new Prisma.Decimal(amount) },
  });
  revalidatePath("/recurring");
  return { success: true };
}

export async function updateRecurringItem(id: string, data: unknown) {
  const parsed = recurringSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { amount, ...rest } = parsed.data;
  await db.recurringItem.update({
    where: { id },
    data: { ...rest, amount: new Prisma.Decimal(amount) },
  });
  revalidatePath("/recurring");
  return { success: true };
}

export async function toggleRecurringItem(id: string, isActive: boolean) {
  await db.recurringItem.update({ where: { id }, data: { isActive } });
  revalidatePath("/recurring");
  return { success: true };
}

export async function deleteRecurringItem(id: string) {
  await db.recurringItem.delete({ where: { id } });
  revalidatePath("/recurring");
  return { success: true };
}

function getNextDate(current: Date, frequency: string, dayOfMonth?: number | null): Date {
  let next: Date;
  switch (frequency) {
    case "WEEKLY":
      next = addWeeks(current, 1);
      break;
    case "BIWEEKLY":
      next = addWeeks(current, 2);
      break;
    case "QUARTERLY":
      next = addQuarters(current, 1);
      break;
    case "YEARLY":
      next = addYears(current, 1);
      break;
    default: // MONTHLY
      next = addMonths(current, 1);
  }
  if (dayOfMonth && ["MONTHLY", "QUARTERLY", "YEARLY"].includes(frequency)) {
    next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
  }
  return next;
}

export async function processRecurringItems() {
  const items = await db.recurringItem.findMany({ where: { isActive: true } });
  const today = startOfDay(new Date());
  let processed = 0;

  for (const item of items) {
    if (item.endDate && isBefore(item.endDate, today)) continue;

    let cursor = item.lastProcessed
      ? startOfDay(new Date(item.lastProcessed))
      : startOfDay(new Date(item.startDate));

    // Advance cursor to the first due date
    let next = getNextDate(cursor, item.frequency, item.dayOfMonth);
    if (!item.lastProcessed) {
      // First ever run — check if startDate itself is due
      const startDay = startOfDay(new Date(item.startDate));
      if (!isBefore(today, startDay)) {
        await db.transaction.create({
          data: {
            type: item.type,
            amount: item.amount,
            description: item.name,
            date: startDay,
            categoryId: item.categoryId,
            recurringId: item.id,
          },
        });
        processed++;
        cursor = startDay;
        next = getNextDate(cursor, item.frequency, item.dayOfMonth);
      }
    }

    while (!isBefore(today, next)) {
      await db.transaction.create({
        data: {
          type: item.type,
          amount: item.amount,
          description: item.name,
          date: next,
          categoryId: item.categoryId,
          recurringId: item.id,
        },
      });
      processed++;
      cursor = next;
      next = getNextDate(cursor, item.frequency, item.dayOfMonth);
    }

    await db.recurringItem.update({
      where: { id: item.id },
      data: { lastProcessed: today },
    });
  }

  if (processed > 0) revalidatePath("/", "layout");
  return { processed };
}
