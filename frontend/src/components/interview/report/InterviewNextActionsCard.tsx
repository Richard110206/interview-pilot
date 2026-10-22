import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import type { ReviewFeedback } from "@/components/interview/report/types";

type InterviewNextActionsCardProps = {
  reviewFeedback: ReviewFeedback;
  sortedSuggestions: string[];
  isRecordLoading: boolean;
  recordError: string | null;
};

export default function InterviewNextActionsCard({
  reviewFeedback,
  sortedSuggestions,
  isRecordLoading,
  recordError,
}: InterviewNextActionsCardProps) {
  const nextActions =
    reviewFeedback.nextActions.length > 0
      ? reviewFeedback.nextActions
      : sortedSuggestions.slice(0, 3);

  return (
    <Card className="report-next-actions border-border p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">下一步建议</p>
          <p className="mt-1 text-xs text-muted-foreground">
            把本场面试的反馈沉淀成可执行动作，下一次练习直接照着优化。
          </p>
        </div>
        <div className="shrink-0 whitespace-nowrap rounded-md bg-indigo-50 px-3 py-1 text-[11px] font-medium text-foreground">
          行动建议
        </div>
      </div>

      <div className="report-action-list mt-5">
        {isRecordLoading && (
          <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            正在生成下一步建议...
          </div>
        )}

        {recordError && (
          <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {recordError}
          </div>
        )}

        {!isRecordLoading && !recordError && nextActions.length > 0
          ? nextActions.map((item, index) => (
              <motion.div
                key={`${index}-${item}`}
                className="flex gap-3 rounded-lg bg-muted px-4 py-4"
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.28,
                  delay: index * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-foreground/85">{item}</p>
              </motion.div>
            ))
          : null}

        {!isRecordLoading && !recordError && nextActions.length === 0 && (
          <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            当前暂无后续建议
          </div>
        )}
      </div>
    </Card>
  );
}
