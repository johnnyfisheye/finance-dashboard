"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatMonthYear } from "@/lib/utils";

interface CashFlowData {
  monthYear: string;
  income: number;
  expense: number;
  savings: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    month: formatMonthYear(d.monthYear).split(" ")[0],
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={formatted} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
          className="text-muted-foreground"
        />
        <Tooltip
          formatter={(value) =>
            new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value))
          }
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="income" name="Income" fill="#22c55e" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
