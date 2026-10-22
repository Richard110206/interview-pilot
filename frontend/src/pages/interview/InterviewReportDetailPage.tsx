import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import InterviewQaReplayCard from "@/components/interview/report/InterviewQaReplayCard";
import { ROUTES } from "@/lib/constants";
import {
  buildReportSearch,
  getReportSessionIdFromLocation,
} from "@/lib/interviewReportRoute";
import { useInterviewReportData } from "@/hooks/interview/report/useInterviewReportData";

const scoreText = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value) ? `${value}` : "--";

export default function InterviewReportDetailPage() {
  const location = useLocation();
  const reportSessionId = getReportSessionIdFromLocation(location);

  const {
    isRecordLoading,
    recordError,
    resumeScore,
    interviewScore,
    compositeScore,
    qaReviews,
    reviewFeedback,
  } = useInterviewReportData(reportSessionId);

  const reportBackLink = `${ROUTES.interviewReport}${buildReportSearch(reportSessionId)}`;

  return (
    <div className="h-full overflow-y-auto bg-muted/60">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <Card className="border-border p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center rounded-md border border-border bg-sheet px-3 py-1 text-xs text-muted-foreground">
                复盘模式
              </div>
              <h1 className="app-title">报告详情</h1>
              <p className="text-base leading-7 text-foreground/85">
                字号已放大，适合逐题复盘与讲评演练。
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-md">
              <Link
                to={reportBackLink}
                state={
                  reportSessionId ? { sessionId: reportSessionId } : undefined
                }
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                返回报告总览
              </Link>
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-sheet px-4 py-3">
              <div className="text-sm text-muted-foreground">简历得分</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">
                {scoreText(resumeScore)}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-sheet px-4 py-3">
              <div className="text-sm text-muted-foreground">面试得分</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">
                {scoreText(interviewScore)}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-sheet px-4 py-3">
              <div className="text-sm text-muted-foreground">综合得分</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">
                {scoreText(compositeScore)}
              </div>
            </div>
          </div>
        </Card>

        {!reportSessionId ? (
          <Card className="border-transparent bg-secondary/60 p-5 text-primary">
            未获取到会话 ID，请从面试报告页进入详情页。
          </Card>
        ) : null}

        {reviewFeedback.overallComment ? (
          <Card className="border-border p-6">
            <div className="flex items-center gap-2 text-base font-medium text-foreground">
              <FileSearch className="h-4 w-4 text-muted-foreground" />
              面试官总评
            </div>
            <p className="mt-3 text-base leading-8 text-foreground/85">
              {reviewFeedback.overallComment}
            </p>
          </Card>
        ) : null}

        <InterviewQaReplayCard
          qaReviews={qaReviews}
          isRecordLoading={isRecordLoading}
          recordError={recordError}
          variant="detail"
        />
      </div>
    </div>
  );
}
