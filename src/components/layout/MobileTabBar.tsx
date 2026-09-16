"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { LogOut, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { navItems, primaryMobileHrefs, isActivePath } from "./nav-items";

const primaryItems = primaryMobileHrefs.map((href) => navItems.find((n) => n.href === href)!);
const moreItems = navItems.filter((n) => !(primaryMobileHrefs as readonly string[]).includes(n.href));

export function MobileTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreItems.some((n) => isActivePath(pathname, n.href));

  const tabClass = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
      active ? "text-foreground" : "text-muted-foreground",
    );

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {primaryItems.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link key={href} href={href} className={tabClass(active)} aria-current={active ? "page" : undefined}>
              <Icon className={cn("size-5", active && "stroke-[2.5]")} />
              {label}
            </Link>
          );
        })}
        <button type="button" onClick={() => setMoreOpen(true)} className={tabClass(moreActive)} aria-haspopup="dialog">
          <MoreHorizontal className={cn("size-5", moreActive && "stroke-[2.5]")} />
          More
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-[max(env(safe-area-inset-bottom),1rem)]">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 px-4">
            {moreItems.map(({ href, label, icon: Icon }) => {
              const active = isActivePath(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-colors",
                    active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent",
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="px-4 pt-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
