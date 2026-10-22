import { Mic, Plus } from "lucide-react";
import { useTextareaAutosize } from "@/hooks/useTextareaAutosize";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type SmartComposerViewProps = {
  value: string;
  onChange: (value: string) => void;
  onSend?: () => void;
  placeholder?: string;
  disabled?: boolean;
  showDefaultLeading?: boolean;
  showVoiceButton?: boolean;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  isRecording?: boolean;
  onMicClick?: (event: React.MouseEvent) => void;
};

export default function SmartComposerView({
  value,
  onChange,
  onSend,
  placeholder = "今天我能怎么帮助你？",
  disabled = false,
  showDefaultLeading = true,
  showVoiceButton = true,
  leading,
  actions,
  className,
  isRecording = false,
  onMicClick,
}: SmartComposerViewProps) {
  const textareaRef = useTextareaAutosize(value);

  return (
    <div
      className={cn(
        "relative flex flex-col gap-1.5 rounded-lg border bg-sheet transition-colors focus-within:border-input",
        className,
        isRecording && "border-destructive",
      )}
    >
      <div className="flex w-full items-center px-3.5 pb-1 pt-3">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={isRecording ? "正在倾听中…" : placeholder}
          rows={1}
          className="max-h-[200px] min-h-[40px] flex-1 resize-none border-0 bg-transparent px-0 py-1.5 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend?.();
            }
          }}
          disabled={disabled || isRecording}
        />
      </div>

      <div className="flex items-center justify-between px-3 pb-2.5">
        <div className="flex items-center gap-2">
          {leading
            ? leading
            : showDefaultLeading && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  disabled={disabled || isRecording}
                  type="button"
                  aria-label="附加内容"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
        </div>

        <div className="flex items-center gap-2">
          {actions}
          {showVoiceButton && (
            <Button
              variant={isRecording ? "destructive" : "ghost"}
              size="icon"
              className={cn(
                "h-8 w-8",
                !isRecording && "text-muted-foreground",
              )}
              onClick={onMicClick}
              type="button"
              disabled={disabled}
              aria-label="语音输入"
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
