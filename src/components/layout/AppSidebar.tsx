"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  RefreshCw,
  Target,
  BarChart3,
  Briefcase,
  Wallet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Tag,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowUpDown },
  { href: "/income", label: "Income", icon: TrendingUp },
  { href: "/expenses", label: "Expenses", icon: TrendingDown },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/recurring", label: "Recurring", icon: RefreshCw },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/investments", label: "Investments", icon: Briefcase },
  { href: "/net-worth", label: "Net Worth", icon: Wallet },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/categories", label: "Categories", icon: Tag },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r bg-card transition-all duration-200 shrink-0",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 h-14 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm truncate">Finance</span>
          </div>
        )}
        {collapsed && (
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground mx-auto">
            <TrendingUp className="w-4 h-4" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7 shrink-0", collapsed && "mx-auto mt-0")}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-2">
        <nav className="px-2 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          className={cn(
            "w-full text-muted-foreground hover:text-foreground gap-3",
            collapsed ? "justify-center px-0" : "justify-start px-2"
          )}
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-sm">Sign out</span>}
        </Button>
      </div>
    </aside>
  );
}
