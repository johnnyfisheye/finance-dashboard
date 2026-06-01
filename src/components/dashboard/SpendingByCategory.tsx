"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface CategoryData {
  name: string;
  total: number;
  color: string;
}

export function SpendingByCategory({ data }: { data: CategoryData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
        No expense data for this month
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) =>
            new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value))
          }
        />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
