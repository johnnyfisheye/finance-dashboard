"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { netWorthItemSchema } from "@/lib/validators/net-worth";
import { Prisma } from "@/generated/prisma/client";
import { getMonthYear } from "@/lib/utils";

export async function getNetWorthItems() {
  return db.netWorthItem.findMany({ orderBy: { itemType: "asc" } });
}

export async function createNetWorthItem(data: unknown) {
  const parsed = netWorthItemSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { value, ...rest } = parsed.data;
  await db.netWorthItem.create({ data: { ...rest, value: new Prisma.Decimal(value) } });
  revalidatePath("/net-worth");
  return { success: true };
}

export async function updateNetWorthItem(id: string, data: unknown) {
  const parsed = netWorthItemSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { value, ...rest } = parsed.data;
  await db.netWorthItem.update({
    where: { id },
    data: { ...rest, value: new Prisma.Decimal(value) },
  });
  revalidatePath("/net-worth");
  return { success: true };
}

export async function deleteNetWorthItem(id: string) {
  await db.netWorthItem.delete({ where: { id } });
  revalidatePath("/net-worth");
  return { success: true };
}

export async function snapshotNetWorth() {
  const items = await db.netWorthItem.findMany();
  const totalAssets = items
    .filter((i) => i.itemType === "ASSET")
    .reduce((sum, i) => sum + i.value.toNumber(), 0);
  const totalLiabilities = items
    .filter((i) => i.itemType === "LIABILITY")
    .reduce((sum, i) => sum + i.value.toNumber(), 0);
  const netWorth = totalAssets - totalLiabilities;
  const monthYear = getMonthYear();

  await db.netWorthSnapshot.upsert({
    where: { monthYear },
    update: {
      totalAssets: new Prisma.Decimal(totalAssets),
      totalLiabilities: new Prisma.Decimal(totalLiabilities),
      netWorth: new Prisma.Decimal(netWorth),
    },
    create: {
      monthYear,
      totalAssets: new Prisma.Decimal(totalAssets),
      totalLiabilities: new Prisma.Decimal(totalLiabilities),
      netWorth: new Prisma.Decimal(netWorth),
    },
  });

  revalidatePath("/net-worth");
  return { success: true, totalAssets, totalLiabilities, netWorth };
}

export async function getNetWorthHistory() {
  const snapshots = await db.netWorthSnapshot.findMany({ orderBy: { monthYear: "asc" } });
  return snapshots.map((s) => ({
    monthYear: s.monthYear,
    totalAssets: s.totalAssets.toNumber(),
    totalLiabilities: s.totalLiabilities.toNumber(),
    netWorth: s.netWorth.toNumber(),
  }));
}
