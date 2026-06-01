import { TrendingDown, BarChart3, AlertCircle } from "lucide-react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMonthlyTotals, getCategoryBreakdown, getTransactions } from "@/actions/transactions";
import { getMonthYear, getPreviousMonths, formatCurrency } from "@/lib/utils";
import { IncomeExpenseCharts } from "@/components/shared/IncomeExpenseCharts";
import { SpendingByCategory } from "@/components/dashboard/SpendingByCategory";
import { TransactionTable } from "@/components/transactions/TransactionTable";

export default async function ExpensesPage() {
  const currentMonth = getMonthYear();
  const months = getPreviousMonths(6);

  const [monthlyTotals, categoryBreakdown, { transactions }] = await Promise.all([
    getMonthlyTotals(months),
    getCategoryBreakdown(currentMonth),
    getTransactions({ type: "EXPENSE", pageSize: 50 }),
  ]);

  const current = monthlyTotals.at(-1) ?? { income: 0, expense: 0, savings: 0 };
  const previous = monthlyTotals.at(-2) ?? { income: 0, expense: 0, savings: 0 };
  const trend = previous.expense > 0 ? ((current.expense - previous.expense) / previous.expense) * 100 : 0;
  const total6m = monthlyTotals.reduce((s: number, m) => s + m.expense, 0);
  const avgMonthly = total6m / 6;

  return (
    <div>
      <DashboardHeader title="Expenses" description="Track where your money goes" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard title="This Month" value={formatCurrency(current.expense)} icon={TrendingDown} status={current.expense > current.income ? "negative" : "default"} trend={{ value: trend }} />
        <KpiCard title="6-Month Total" value={formatCurrency(total6m)} icon={BarChart3} status="default" />
        <KpiCard title="Monthly Average" value={formatCurrency(avgMonthly)} icon={AlertCircle} status="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <IncomeExpenseCharts data={monthlyTotals} mode="expense" />
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingByCategory data={categoryBreakdown} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Expense Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TransactionTable transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  );
}
