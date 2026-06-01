import { Suspense } from "react";
import { TrendingUp, TrendingDown, PiggyBank, Wallet } from "lucide-react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { SpendingByCategory } from "@/components/dashboard/SpendingByCategory";
import { BudgetProgress } from "@/components/dashboard/BudgetProgress";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { getMonthlyTotals, getCategoryBreakdown, getRecentTransactions } from "@/actions/transactions";
import { getBudgetsWithSpending } from "@/actions/budgets";
import { processRecurringItems } from "@/actions/recurring";
import { formatCurrency, getMonthYear, getPreviousMonths } from "@/lib/utils";

export default async function DashboardPage() {
  // Process any due recurring transactions
  await processRecurringItems();

  const currentMonth = getMonthYear();
  const months = getPreviousMonths(6);

  const [monthlyTotals, categoryBreakdown, recentTransactions, budgets] = await Promise.all([
    getMonthlyTotals(months),
    getCategoryBreakdown(currentMonth),
    getRecentTransactions(8),
    getBudgetsWithSpending(currentMonth),
  ]);

  const current = monthlyTotals.at(-1) ?? { income: 0, expense: 0, savings: 0 };
  const previous = monthlyTotals.at(-2) ?? { income: 0, expense: 0, savings: 0 };

  function trend(cur: number, prev: number) {
    if (prev === 0) return 0;
    return ((cur - prev) / prev) * 100;
  }

  const overBudgetCount = budgets.filter((b: { isOverBudget: boolean }) => b.isOverBudget).length;

  return (
    <div>
      <DashboardHeader title="Overview" description={`${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`} />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Income"
          value={formatCurrency(current.income)}
          icon={TrendingUp}
          status="positive"
          trend={{ value: trend(current.income, previous.income) }}
        />
        <KpiCard
          title="Expenses"
          value={formatCurrency(current.expense)}
          icon={TrendingDown}
          status={current.expense > current.income ? "negative" : "default"}
          trend={{ value: trend(current.expense, previous.expense) }}
        />
        <KpiCard
          title="Savings"
          value={formatCurrency(current.savings)}
          icon={PiggyBank}
          status={current.savings >= 0 ? "positive" : "negative"}
          trend={{ value: trend(current.savings, previous.savings) }}
        />
        <KpiCard
          title="Budgets Over Limit"
          value={overBudgetCount === 0 ? "All on track" : `${overBudgetCount} over limit`}
          icon={Wallet}
          status={overBudgetCount === 0 ? "positive" : "negative"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cash Flow (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <CashFlowChart data={monthlyTotals} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingByCategory data={categoryBreakdown} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Budget Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetProgress budgets={budgets} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={recentTransactions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
