import { cn } from "@/lib/utils";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("px-4 py-6 text-center text-xs text-muted-foreground", className)}>
      © 2026 Esinemisarved. Built with Claude Code
    </footer>
  );
}
