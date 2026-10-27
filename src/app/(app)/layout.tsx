import { LogOut, Music } from "lucide-react";
import { DesktopNav, MobileNav } from "@/components/app-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[720px] items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Music className="size-4" />
            </span>
            Esinemisarved
          </div>
          <DesktopNav />
          <form action="/api/logout" method="post">
            <button
              type="submit"
              className="flex h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="size-4" />
              Logi välja
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 pt-6 pb-28 md:pb-12">{children}</main>
      <MobileNav />
    </>
  );
}
