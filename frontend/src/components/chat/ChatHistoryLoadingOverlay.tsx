import { Loader2 } from "lucide-react";

export default function ChatHistoryLoadingOverlay() {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
      <div className="rounded-lg border border-border bg-sheet px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-foreground/85">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span>正在加载会话历史…</span>
        </div>
      </div>
    </div>
  );
}
