import { CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed bg-card px-6 py-10 text-center">
      <CloudOff className="size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Proovi uuesti
        </Button>
      )}
    </div>
  );
}
