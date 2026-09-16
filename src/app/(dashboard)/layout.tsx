import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileTabBar } from "@/components/layout/MobileTabBar";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <AppSidebar className="hidden md:flex" />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto p-4 pb-24 md:p-6 md:pb-6">{children}</div>
      </main>
      <MobileTabBar />
    </div>
  );
}
