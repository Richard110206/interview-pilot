import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatProgressBubbleProps = {
  label: string;
  steps: string[];
  activeStep: number;
};

export default function ChatProgressBubble({
  label,
  steps,
  activeStep,
}: ChatProgressBubbleProps) {
  const normalizedActiveStep = Math.min(
    Math.max(activeStep, 0),
    Math.max(steps.length - 1, 0),
  );
  const progressPercent =
    steps.length > 1 ? ((normalizedActiveStep + 1) / steps.length) * 100 : 100;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full rounded-lg border border-border bg-muted px-4 py-4 text-foreground/85"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-sheet text-foreground/85">
            <motion.div
              aria-hidden
              className="absolute inset-0 rounded-md border border-input/70"
              animate={{
                opacity: [0.25, 0.7, 0.25],
                scale: [0.95, 1.02, 0.95],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <Loader2 className="relative h-4 w-4 animate-spin" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              请稍候，系统正在处理本轮回答并准备下一步反馈。
            </p>
          </div>
        </div>
        <div className="num shrink-0 rounded-sm border border-border bg-sheet px-2 py-0.5 text-xs text-muted-foreground">
          {Math.min(normalizedActiveStep + 1, Math.max(steps.length, 1))}/
          {Math.max(steps.length, 1)}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, index) => {
          const isCompleted = index < normalizedActiveStep;
          const isCurrent = index === normalizedActiveStep;
          const stepStateText = isCompleted
            ? "已完成"
            : isCurrent
              ? "进行中"
              : "等待中";

          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2.5 text-xs transition-colors",
                isCompleted &&
                  "border-transparent bg-primary/5 text-primary",
                isCurrent && "border-input bg-sheet text-foreground/85",
                !isCompleted &&
                  !isCurrent &&
                  "border-border/60 bg-sheet/80 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "num flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                  isCompleted &&
                    "border-transparent bg-[hsl(150_60%_30%)] text-white",
                  isCurrent && "border-input bg-secondary text-foreground",
                  !isCompleted &&
                    !isCurrent &&
                    "border-input bg-sheet text-muted-foreground",
                )}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{step}</p>
                <p className="mt-0.5 text-[11px] opacity-80">{stepStateText}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <div className="num mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>处理进度</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-foreground"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
