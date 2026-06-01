import { format } from "date-fns";
import { AmountDisplay } from "@/components/shared/AmountDisplay";
import { CategoryBadge } from "@/components/shared/CategoryBadge";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: { toNumber(): number };
  description: string;
  date: Date;
  category: { name: string; icon?: string | null; color?: string | null };
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No transactions yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {transactions.map((t) => (
        <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium truncate">{t.description}</span>
            <div className="flex items-center gap-2">
              <CategoryBadge name={t.category.name} icon={t.category.icon} color={t.category.color} />
              <span className="text-xs text-muted-foreground">{format(new Date(t.date), "dd MMM")}</span>
            </div>
          </div>
          <AmountDisplay
            amount={t.amount}
            type={t.type === "INCOME" ? "income" : "expense"}
            showSign={t.type === "INCOME"}
            className="ml-3 shrink-0 text-sm"
          />
        </div>
      ))}
    </div>
  );
}
