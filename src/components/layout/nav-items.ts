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
  Tag,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Every dashboard page, in sidebar order. */
export const navItems: NavItem[] = [
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

/** The four pages that get a dedicated slot in the mobile tab bar. */
export const primaryMobileHrefs = ["/dashboard", "/transactions", "/budgets", "/reports"] as const;

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}
