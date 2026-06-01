"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMonthYear } from "@/lib/utils";

interface MonthData {
  monthYear: string;
  income: number;
  expense: number;
  savings: number;
}

interface Props {
  data: MonthData[];
  mode: "income" | "expense";
}

export function IncomeExpenseCharts({ data, mode }: Props) {
  const chartData = data.map((d) => ({
    month: formatMonthYear(d.monthYear).split(" ")[0],
    value: mode === "income" ? d.income : d.expense,
  }));

  const color = mode === "income" ? "#22c55e" : "#ef4444";
  const label = mode === "income" ? "Income" : "Expenses";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{label} Trend (6 months)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(v))} />
            <Bar dataKey="value" name={label} fill={color} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
