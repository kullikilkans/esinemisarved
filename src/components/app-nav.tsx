"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, Files, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Uus arve", icon: FilePlus2 },
  { href: "/arved", label: "Arved", icon: Files },
  { href: "/kliendid", label: "Kliendid", icon: Users },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

// Tabs shown in the header on desktop
export function DesktopNav() {
  const isActive = useIsActive();
  return (
    <nav className="hidden gap-1 md:flex" aria-label="Põhimenüü">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            isActive(href) && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

// Fixed bottom navigation bar on mobile
export function MobileNav() {
  const isActive = useIsActive();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Põhimenüü"
    >
      <div className="mx-auto grid max-w-[720px] grid-cols-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground",
              isActive(href) && "text-primary",
            )}
          >
            <Icon className="size-6" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
