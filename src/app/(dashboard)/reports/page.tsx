import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMonthlyTotals } from "@/actions/transactions";
import { getPreviousMonths, formatCurrency, formatMonthYear } from "@/lib/utils";
import { MonthlyComparisonChart } from "@/components/reports/MonthlyComparisonChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendBadge } from "@/components/shared/TrendBadge";

export default async function ReportsPage() {
  const months = getPreviousMonths(12);
  const data = await getMonthlyTotals(months);

  function mom(arr: number[], idx: number) {
    const cur = arr[idx];
    const prev = arr[idx - 1];
    if (!prev || prev === 0) return 0;
    return ((cur - prev) / prev) * 100;
  }

  const incomes = data.map((d) => d.income);
  const expenses = data.map((d) => d.expense);
  const savings = data.map((d) => d.savings);

  return (
    <div>
      <DashboardHeader title="Reports" description="Monthly comparison and spending trends" />

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cash Flow — Last 12 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyComparisonChart data={data} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Savings</TableHead>
                <TableHead className="text-right">Income MoM</TableHead>
                <TableHead className="text-right">Expense MoM</TableHead>
                <TableHead className="text-right">Savings %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...data].reverse().map((d, i) => {
                const idx = data.length - 1 - i;
                const savingsPct = d.income > 0 ? (d.savings / d.income) * 100 : 0;
                return (
                  <TableRow key={d.monthYear}>
                    <TableCell className="font-medium text-sm">{formatMonthYear(d.monthYear)}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">{formatCurrency(d.income)}</TableCell>
                    <TableCell className="text-right text-destructive font-medium">{formatCurrency(d.expense)}</TableCell>
                    <TableCell className={`text-right font-medium ${d.savings >= 0 ? "text-green-600" : "text-destructive"}`}>{formatCurrency(d.savings)}</TableCell>
                    <TableCell className="text-right">
                      {idx > 0 ? <TrendBadge value={mom(incomes, idx)} /> : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {idx > 0 ? <TrendBadge value={mom(expenses, idx)} invertColors /> : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className={`text-right text-sm font-medium ${savingsPct >= 20 ? "text-green-600" : savingsPct >= 0 ? "text-amber-600" : "text-destructive"}`}>
                      {savingsPct.toFixed(0)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
