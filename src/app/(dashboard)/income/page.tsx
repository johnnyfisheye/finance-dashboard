import { TrendingUp, ArrowUpRight, BarChart3 } from "lucide-react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMonthlyTotals, getCategoryBreakdown, getTransactions } from "@/actions/transactions";
import { getMonthYear, getPreviousMonths, formatCurrency } from "@/lib/utils";
import { IncomeExpenseCharts } from "@/components/shared/IncomeExpenseCharts";
import { TransactionTable } from "@/components/transactions/TransactionTable";

export default async function IncomePage() {
  const currentMonth = getMonthYear();
  const months = getPreviousMonths(6);

  const [monthlyTotals, { transactions }] = await Promise.all([
    getMonthlyTotals(months),
    getTransactions({ type: "INCOME", pageSize: 50 }),
  ]);

  const current = monthlyTotals.at(-1) ?? { income: 0, expense: 0, savings: 0 };
  const previous = monthlyTotals.at(-2) ?? { income: 0, expense: 0, savings: 0 };
  const trend = previous.income > 0 ? ((current.income - previous.income) / previous.income) * 100 : 0;
  const totalIncome6m = monthlyTotals.reduce((s, m) => s + m.income, 0);
  const avgMonthly = totalIncome6m / 6;

  return (
    <div>
      <DashboardHeader title="Income" description="Track all sources of income" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard title="This Month" value={formatCurrency(current.income)} icon={TrendingUp} status="positive" trend={{ value: trend }} />
        <KpiCard title="6-Month Total" value={formatCurrency(totalIncome6m)} icon={BarChart3} status="default" />
        <KpiCard title="Monthly Average" value={formatCurrency(avgMonthly)} icon={ArrowUpRight} status="default" />
      </div>

      <div className="mb-4">
        <IncomeExpenseCharts data={monthlyTotals} mode="income" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Income Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TransactionTable transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  );
}
