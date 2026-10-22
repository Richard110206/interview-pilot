import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownToLine,
  ChevronDown,
  ChevronUp,
  Copy,
  Mic,
  NotebookPen,
  Square,
  Workflow,
} from "lucide-react";
import type {
  SketchpadActions,
  SketchpadQuestionViewState,
} from "@/components/interview/sketchpad/sketchpadTypes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

type InterviewSketchpadSheetViewProps = {
  open: boolean;
  notes: string;
  displayedTranscriptionBuffer: string;
  question: SketchpadQuestionViewState;
  hasNotes: boolean;
  hasTranscriptionBuffer: boolean;
  isRecording: boolean;
  transcriptionError: string | null;
  saveHint: string;
  actions: SketchpadActions;
};

export function InterviewSketchpadSheetView({
  open,
  notes,
  displayedTranscriptionBuffer,
  question,
  hasNotes,
  hasTranscriptionBuffer,
  isRecording,
  transcriptionError,
  saveHint,
  actions,
}: InterviewSketchpadSheetViewProps) {
  const [isTranscriptionUpdated, setIsTranscriptionUpdated] = useState(false);
  const previousTranscriptionRef = useRef(displayedTranscriptionBuffer);

  useEffect(() => {
    if (displayedTranscriptionBuffer === previousTranscriptionRef.current) {
      return;
    }

    previousTranscriptionRef.current = displayedTranscriptionBuffer;
    const normalizedTranscription = displayedTranscriptionBuffer.trim();

    const startTimerId = window.setTimeout(() => {
      setIsTranscriptionUpdated(normalizedTranscription.length > 0);
    }, 0);
    const finishTimerId =
      normalizedTranscription.length > 0
        ? window.setTimeout(() => {
            setIsTranscriptionUpdated(false);
          }, 220)
        : null;

    return () => {
      window.clearTimeout(startTimerId);
      if (finishTimerId) {
        window.clearTimeout(finishTimerId);
      }
    };
  }, [displayedTranscriptionBuffer]);

  const transcriptionHint = isRecording
    ? "正在实时转写，你可以持续口述思路。"
    : hasTranscriptionBuffer
      ? "已捕获转写内容，可编辑后追加到提纲中。"
      : "可以先口述思路，转写结果会落在这里，整理后再追加到提纲中。";

  return (
    <Sheet open={open} onOpenChange={actions.handleOpenChange}>
      <SheetContent
        side="right"
        className="w-[100vw] max-w-none p-0 sm:w-[56vw] md:w-[52vw] lg:w-[50vw] xl:w-[48vw]"
        onInteractOutside={(event) => {
          const target = event.target as HTMLElement | null;
          if (target?.closest("[data-resume-reference-card='true']")) {
            event.preventDefault();
          }
        }}
      >
        <div className="flex h-full flex-col bg-muted">
          <SheetHeader className="border-b border-border px-6 py-5 text-left">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <NotebookPen className="h-4 w-4" />
              构思板
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              先记录想法、整理表达，再把打磨后的内容带回面试输入框。
            </SheetDescription>
          </SheetHeader>

          <div className="border-b border-border px-6 py-4">
            <div className="rounded-lg border border-border bg-sheet p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Workflow className="h-4 w-4 text-muted-foreground" />
                  当前题目
                  {question.questionNumber ? (
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground">
                      Q{question.questionNumber}
                    </span>
                  ) : null}
                  {question.isSyncing ? (
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground">
                      同步中
                    </span>
                  ) : null}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-md px-3 text-xs text-muted-foreground"
                  onClick={() => actions.setCollapsed(!question.isCollapsed)}
                >
                  {question.isCollapsed ? (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronUp className="mr-1 h-4 w-4" />
                  )}
                  {question.isCollapsed ? "展开题目" : "收起题目"}
                </Button>
              </div>

              <AnimatePresence initial={false}>
                {!question.isCollapsed ? (
                  <motion.div
                    key="question-content"
                    initial={{ height: 0, opacity: 0, y: -6 }}
                    animate={{ height: "auto", opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -4 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="mt-3 text-sm leading-7 text-foreground/85">
                      {question.isFinished
                        ? "本场面试已结束，你仍然可以继续查看并整理当前会话的构思内容。"
                        : question.questionContent ||
                          "当前还没有同步到题目内容，开始面试后这里会显示最新问题。"}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-sheet p-5">
                <p className="text-sm font-medium text-foreground">回答提纲</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  先把结构写清楚，再把整理后的内容带回回答框。
                </p>
                <Textarea
                  value={notes}
                  onChange={(event) => actions.setNotes(event.target.value)}
                  placeholder={`例如：
1. 先说明背景
2. 再解释方案
3. 最后总结结果`}
                  className="mt-4 min-h-[320px] resize-none rounded-lg border-border bg-muted text-sm leading-7"
                />
              </div>

              <div
                className={cn(
                  "rounded-lg border border-dashed border-border bg-muted/80 p-4 transition-colors duration-200",
                  isRecording && "border-red-200 bg-red-50/40",
                  transcriptionError && "border-red-300 bg-red-50/50",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    语音转写缓冲区
                  </p>
                  <span
                    aria-live="polite"
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs",
                      transcriptionError
                        ? "bg-red-100 text-red-700"
                        : isRecording
                          ? "bg-red-100 text-red-700"
                          : hasTranscriptionBuffer
                            ? "bg-emerald-100 text-primary"
                            : "bg-secondary text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        transcriptionError
                          ? "bg-red-500"
                          : isRecording
                            ? "bg-red-500 sketchpad-status-dot-pulse"
                            : hasTranscriptionBuffer
                              ? "bg-emerald-500"
                              : "bg-muted-foreground",
                      )}
                    />
                    {transcriptionError
                      ? "转写异常"
                      : isRecording
                        ? "正在转写"
                        : hasTranscriptionBuffer
                          ? "已更新"
                          : "待开始"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {transcriptionHint}
                </p>
                <div
                  className={cn(
                    "relative mt-4 overflow-hidden rounded-lg",
                    isRecording && "sketchpad-transcription-live",
                    isTranscriptionUpdated && "sketchpad-transcription-updated",
                  )}
                >
                  <Textarea
                    value={displayedTranscriptionBuffer}
                    onChange={(event) =>
                      actions.setTranscriptionBuffer(event.target.value)
                    }
                    placeholder="开始转写后，这里会显示语音识别结果。"
                    readOnly={isRecording}
                    className={cn(
                      "min-h-[160px] resize-none rounded-lg border-border bg-sheet text-sm leading-7 transition-colors duration-200",
                      isRecording && "border-red-200 pr-10",
                    )}
                  />
                  {isRecording ? (
                    <span className="pointer-events-none absolute bottom-4 right-4 h-2 w-2 rounded-full bg-red-500 sketchpad-recording-ping" />
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className={cn(
                      "rounded-md transition-all duration-200",
                      isRecording &&
                        "sketchpad-mic-active shadow-sm shadow-red-200",
                    )}
                    variant={isRecording ? "destructive" : "secondary"}
                    onClick={() => {
                      void actions.toggleRecording();
                    }}
                  >
                    {isRecording ? (
                      <Square className="mr-2 h-4 w-4 sketchpad-recording-icon" />
                    ) : (
                      <Mic className="mr-2 h-4 w-4" />
                    )}
                    {isRecording ? "停止转写" : "开始转写"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-md"
                    onClick={actions.appendTranscriptionToNotes}
                    disabled={!hasTranscriptionBuffer}
                  >
                    <ArrowDownToLine className="mr-2 h-4 w-4" />
                    追加到提纲
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-md"
                    onClick={() => {
                      void actions.copyTranscription();
                    }}
                    disabled={!hasTranscriptionBuffer}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    复制文本
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-md"
                    onClick={actions.clearTranscription}
                    disabled={!hasTranscriptionBuffer || isRecording}
                  >
                    清空缓冲区
                  </Button>
                </div>
                {transcriptionError ? (
                  <p className="mt-3 text-xs text-red-500">
                    {transcriptionError}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  className="rounded-md"
                  onClick={actions.insertNotes}
                  disabled={!hasNotes}
                >
                  插入回答框
                </Button>
                <Button
                  variant="outline"
                  className="rounded-md"
                  onClick={actions.clearNotes}
                  disabled={!hasNotes}
                >
                  清空提纲
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-border px-6 py-3 text-xs text-muted-foreground">
            {saveHint}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
