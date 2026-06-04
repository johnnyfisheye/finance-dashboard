import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const expenseCategories = [
  { name: "Groceries", icon: "ShoppingCart", color: "#22c55e", isFixed: false, isInvestment: false },
  { name: "Dining", icon: "UtensilsCrossed", color: "#f97316", isFixed: false, isInvestment: false },
  { name: "Subscriptions", icon: "RefreshCw", color: "#8b5cf6", isFixed: true, isInvestment: false },
  { name: "Transport", icon: "Car", color: "#3b82f6", isFixed: true, isInvestment: false },
  { name: "Utilities", icon: "Zap", color: "#06b6d4", isFixed: true, isInvestment: false },
  { name: "Rent/Mortgage", icon: "Home", color: "#ef4444", isFixed: true, isInvestment: false },
  { name: "Healthcare", icon: "Heart", color: "#ec4899", isFixed: true, isInvestment: false },
  { name: "Entertainment", icon: "Tv", color: "#f59e0b", isFixed: false, isInvestment: false },
  { name: "Shopping", icon: "ShoppingBag", color: "#84cc16", isFixed: false, isInvestment: false },
  { name: "Education", icon: "GraduationCap", color: "#6366f1", isFixed: false, isInvestment: false },
  { name: "Travel", icon: "Plane", color: "#14b8a6", isFixed: false, isInvestment: false },
  { name: "Personal Care", icon: "Smile", color: "#d946ef", isFixed: false, isInvestment: false },
  { name: "Gifts", icon: "Gift", color: "#f43f5e", isFixed: false, isInvestment: false },
  { name: "Investment Contribution", icon: "TrendingUp", color: "#3b82f6", isFixed: false, isInvestment: true },
  { name: "Other", icon: "MoreHorizontal", color: "#94a3b8", isFixed: false, isInvestment: false },
];

const incomeCategories = [
  { name: "Salary", icon: "Briefcase", color: "#22c55e" },
  { name: "Freelance", icon: "Laptop", color: "#10b981" },
  { name: "Investments", icon: "TrendingUp", color: "#3b82f6" },
  { name: "Rental Income", icon: "Building2", color: "#8b5cf6" },
  { name: "Dividends", icon: "DollarSign", color: "#f59e0b" },
  { name: "Other Income", icon: "PlusCircle", color: "#94a3b8" },
];

async function main() {
  console.log("Seeding categories...");

  for (const cat of expenseCategories) {
    await db.category.upsert({
      where: { name: cat.name },
      update: { icon: cat.icon, color: cat.color, isFixed: cat.isFixed, isInvestment: cat.isInvestment },
      create: { ...cat, isIncome: false, isSystem: true },
    });
  }

  for (const cat of incomeCategories) {
    await db.category.upsert({
      where: { name: cat.name },
      update: { icon: cat.icon, color: cat.color },
      create: { ...cat, isIncome: true, isSystem: true },
    });
  }

  console.log("Seeding user...");

  const email = process.env.SEED_USER_EMAIL;
  const password = process.env.SEED_USER_PASSWORD;

  if (!email || !password) {
    console.warn("SEED_USER_EMAIL or SEED_USER_PASSWORD not set — skipping user seed");
  } else {
    const hashed = await hash(password, 12);
    await db.user.upsert({
      where: { email },
      update: {},
      create: { email, password: hashed, name: "João" },
    });
    console.log(`User ${email} seeded.`);
  }

  if (process.env.SEED_DEMO_DATA === "true") {
    await seedDemoData();
  }

  console.log("Seed complete.");
}

async function seedDemoData() {
  console.log("Seeding demo data...");

  const categories = await db.category.findMany();
  const catByName = Object.fromEntries(categories.map((c: { id: string; name: string }) => [c.name, c]));

  const now = new Date();
  const transactions = [];

  // 6 months of sample transactions
  for (let m = 5; m >= 0; m--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);

    // Salary income
    transactions.push({
      type: "INCOME" as const,
      amount: 3500,
      description: "Monthly Salary",
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
      categoryId: catByName["Salary"].id,
    });

    // Rent expense
    transactions.push({
      type: "EXPENSE" as const,
      amount: 900,
      description: "Rent",
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 2),
      categoryId: catByName["Rent/Mortgage"].id,
    });

    // Groceries
    transactions.push({
      type: "EXPENSE" as const,
      amount: Math.round(200 + Math.random() * 100),
      description: "Supermarket",
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5),
      categoryId: catByName["Groceries"].id,
    });

    // Dining
    transactions.push({
      type: "EXPENSE" as const,
      amount: Math.round(80 + Math.random() * 60),
      description: "Restaurants",
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10),
      categoryId: catByName["Dining"].id,
    });

    // Subscriptions
    transactions.push({
      type: "EXPENSE" as const,
      amount: 45,
      description: "Netflix, Spotify, etc.",
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15),
      categoryId: catByName["Subscriptions"].id,
    });

    // Transport
    transactions.push({
      type: "EXPENSE" as const,
      amount: Math.round(60 + Math.random() * 40),
      description: "Transport",
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 18),
      categoryId: catByName["Transport"].id,
    });
  }

  for (const t of transactions) {
    await db.transaction.create({ data: t });
  }

  // Demo budgets for current month
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const budgetData = [
    { name: "Groceries", limit: 350 },
    { name: "Dining", limit: 200 },
    { name: "Transport", limit: 150 },
    { name: "Subscriptions", limit: 60 },
    { name: "Entertainment", limit: 100 },
    { name: "Shopping", limit: 200 },
    { name: "Rent/Mortgage", limit: 950 },
  ];

  for (const b of budgetData) {
    if (catByName[b.name]) {
      await db.budget.upsert({
        where: { categoryId_monthYear: { categoryId: catByName[b.name].id, monthYear: currentMonth } },
        update: {},
        create: { categoryId: catByName[b.name].id, monthYear: currentMonth, limitAmount: b.limit, alertAt: 0.8 },
      });
    }
  }

  // Demo goals
  await db.goal.createMany({
    data: [
      {
        name: "Emergency Fund",
        description: "6 months of expenses",
        targetAmount: 15000,
        currentAmount: 6500,
        targetDate: new Date(now.getFullYear() + 1, now.getMonth(), 1),
        status: "ACTIVE",
        color: "#22c55e",
        icon: "Shield",
      },
      {
        name: "Vacation to Japan",
        targetAmount: 4000,
        currentAmount: 1200,
        targetDate: new Date(now.getFullYear(), now.getMonth() + 8, 1),
        status: "ACTIVE",
        color: "#3b82f6",
        icon: "Plane",
      },
      {
        name: "New Laptop",
        targetAmount: 2500,
        currentAmount: 2500,
        targetDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        status: "COMPLETED",
        color: "#8b5cf6",
        icon: "Laptop",
      },
    ],
    skipDuplicates: true,
  });

  // Demo investments
  const inv1 = await db.investment.create({
    data: {
      name: "MSCI World ETF",
      ticker: "IWDA",
      assetClass: "ETF",
      quantity: 85.5,
      costBasis: 8200,
      currentValue: 9800,
      purchaseDate: new Date(now.getFullYear() - 2, 3, 1),
    },
  });

  const inv2 = await db.investment.create({
    data: {
      name: "Apple Inc.",
      ticker: "AAPL",
      assetClass: "STOCK",
      quantity: 20,
      costBasis: 3000,
      currentValue: 3600,
      purchaseDate: new Date(now.getFullYear() - 1, 8, 1),
    },
  });

  const inv3 = await db.investment.create({
    data: {
      name: "Bitcoin",
      ticker: "BTC",
      assetClass: "CRYPTO",
      quantity: 0.12,
      costBasis: 4500,
      currentValue: 6200,
      purchaseDate: new Date(now.getFullYear() - 1, 0, 1),
    },
  });

  // Investment snapshots (6 months)
  const investments = [inv1, inv2, inv3];
  const baseValues = [8500, 3100, 4800];
  const growthRates = [0.025, 0.02, 0.04];

  for (const [i, inv] of investments.entries()) {
    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const value = baseValues[i] * Math.pow(1 + growthRates[i], 5 - m);
      await db.investmentSnapshot.create({
        data: { investmentId: inv.id, date: d, value: Math.round(value) },
      });
    }
  }

  // Demo net worth items
  await db.netWorthItem.createMany({
    data: [
      { name: "Savings Account", itemType: "ASSET", subtype: "Cash", value: 8500 },
      { name: "Investment Portfolio", itemType: "ASSET", subtype: "Investments", value: 19600 },
      { name: "Emergency Fund", itemType: "ASSET", subtype: "Cash", value: 6500 },
      { name: "Car", itemType: "ASSET", subtype: "Vehicle", value: 12000 },
      { name: "Student Loan", itemType: "LIABILITY", subtype: "Loan", value: 5000 },
      { name: "Credit Card Balance", itemType: "LIABILITY", subtype: "Credit Card", value: 450 },
    ],
  });

  // Net worth snapshots
  const assetTotals = [35000, 36500, 38200, 40100, 41800, 46600];
  const liabilityTotals = [6000, 5800, 5700, 5600, 5500, 5450];

  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const idx = 5 - m;
    await db.netWorthSnapshot.upsert({
      where: { monthYear: mKey },
      update: {},
      create: {
        monthYear: mKey,
        totalAssets: assetTotals[idx],
        totalLiabilities: liabilityTotals[idx],
        netWorth: assetTotals[idx] - liabilityTotals[idx],
      },
    });
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
