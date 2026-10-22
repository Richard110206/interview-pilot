import { motion } from "framer-motion";
import { ExternalLink, FileText } from "lucide-react";
import InterviewResumePreviewContent from "@/components/interview/InterviewResumePreviewContent";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type InterviewResumeReferenceCardProps = {
  open: boolean;
  resumeName?: string | null;
  resumePreviewSource: File | string | undefined;
  resumePreviewError: string | null;
  resumeOpenPreviewUrl: string | null;
  numPages: number;
  onLoadSuccess: (numPages: number) => void;
  onLoadError: (message: string) => void;
};

export default function InterviewResumeReferenceCard({
  open,
  resumeName,
  resumePreviewSource,
  resumePreviewError,
  resumeOpenPreviewUrl,
  numPages,
  onLoadSuccess,
  onLoadError,
}: InterviewResumeReferenceCardProps) {
  const hasResumeEntry = Boolean(
    resumePreviewSource || resumeName || resumePreviewError,
  );
  const hasInlinePreview = Boolean(resumePreviewSource);

  if (!hasResumeEntry) return null;

  const statusLabel = resumePreviewError
    ? "预览不可用"
    : hasInlinePreview
      ? `共 ${numPages} 页`
      : "仅显示摘要信息";

  return (
    <motion.div
      data-resume-reference-card="true"
      initial={{
        opacity: 0,
        y: 120,
        scale: 0.965,
        filter: "blur(10px)",
      }}
      animate={
        open
          ? {
              opacity: 1,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
            }
          : {
              opacity: 0,
              y: 96,
              scale: 0.975,
              filter: "blur(8px)",
            }
      }
      transition={
        open
          ? {
              type: "spring",
              stiffness: 320,
              damping: 30,
              mass: 0.95,
            }
          : {
              duration: 0.28,
              ease: [0.4, 0, 0.2, 1],
            }
      }
      style={{ pointerEvents: open ? "auto" : "none" }}
      aria-hidden={!open}
      className={cn(
        "fixed right-[50.5vw] top-2 z-[60] hidden h-[calc(100vh-1rem)] w-[min(43vw,860px)] max-w-[calc(57vw-2rem)] lg:flex lg:flex-col",
        !open && "select-none",
      )}
    >
      <Card className="flex h-full flex-col overflow-hidden border border-border bg-sheet shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <FileText className="h-4 w-4 text-muted-foreground" />
              简历参考区
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              保持简历关键信息可见，并在侧边参考区直接展示 PDF 预览。
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {resumeName ? (
                <span className="rounded-md bg-secondary px-2.5 py-1">
                  {resumeName}
                </span>
              ) : null}
              <span className="rounded-md bg-secondary px-2.5 py-1">
                {statusLabel}
              </span>
            </div>
          </div>

          {resumeOpenPreviewUrl ? (
            <a
              href={resumeOpenPreviewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 shrink-0 items-center rounded-md border border-border px-3.5 text-sm font-medium text-foreground/85 transition-colors hover:bg-muted"
            >
              <ExternalLink className="mr-1.5 h-4 w-4" />
              新窗口打开
            </a>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 p-4">
          {hasInlinePreview ? (
            <InterviewResumePreviewContent
              resumePreviewSource={resumePreviewSource}
              resumePreviewError={resumePreviewError}
              resumeOpenPreviewUrl={resumeOpenPreviewUrl}
              numPages={numPages}
              onLoadSuccess={onLoadSuccess}
              onLoadError={onLoadError}
            />
          ) : (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/70 px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sheet text-muted-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
                {resumePreviewError
                  ? `当前无法预览简历：${resumePreviewError}`
                  : "简历信息已就绪，但内嵌 PDF 预览源暂时还未准备完成。"}
              </p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
