import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InterviewSourcesPanel from "@/components/interview/report/InterviewSourcesPanel";
import InterviewExecutionPanel from "@/components/interview/InterviewExecutionPanel";
import InterviewReportHeader from "@/components/interview/report/InterviewReportHeader";
import InterviewScoreAndRadarCard from "@/components/interview/report/InterviewScoreAndRadarCard";
import InterviewConclusionCard from "@/components/interview/report/InterviewConclusionCard";
import InterviewNextActionsCard from "@/components/interview/report/InterviewNextActionsCard";
import InterviewQaReplayCard from "@/components/interview/report/InterviewQaReplayCard";
import { useInterviewReportData } from "@/hooks/interview/report/useInterviewReportData";
import { getReportSessionIdFromLocation } from "@/lib/interviewReportRoute";

export default function InterviewReportPage() {
  const location = useLocation();
  const reportSessionId = getReportSessionIdFromLocation(location);

  const {
    isRecordLoading,
    recordError,
    resumeScore,
    interviewScore,
    compositeScore,
    isCompositeEstimated,
    radarPoints,
    sortedSuggestions,
    interviewDirection,
    qaReviews,
    reviewFeedback,
    insights,
    insightsError,
    retryReport,
  } = useInterviewReportData(reportSessionId);

  return (
    <div className="report-page h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <InterviewReportHeader />
        </motion.div>

        {!reportSessionId && (
          <Card className="p-4 border-transparent bg-secondary/60 text-primary text-sm">
            未获取到会话 ID，当前显示为空报告。请从面试流程结束后进入本页。
          </Card>
        )}
        {(recordError || insightsError) && (
          <div role="alert" className="rounded-xl border bg-white p-4 text-sm">
            {recordError || `题目来源与评分说明暂时无法加载：${insightsError}`}
            <Button variant="link" onClick={retryReport}>
              重新加载
            </Button>
          </div>
        )}
        {insights && (
          <details className="report-grading-policy">
            <summary>
              评分口径 ·{" "}
              {insights.primaryCount === 0
                ? "尚未形成回答评分"
                : insights.gradingPolicy === "text-v1"
                  ? "四维 v1"
                  : "历史评分兼容"}{" "}
              {insights.primaryCount > 0 &&
                `· 维度记录 ${insights.dimensionCoverage}/${insights.primaryCount}`}
            </summary>
            <p>{insights.gradingPolicyText}</p>
            {insights.dimensionCoverage < insights.primaryCount && (
              <p>部分历史题目没有记录分维评分，这些题目只保留实际总分。</p>
            )}
          </details>
        )}

        {reportSessionId && (
          <details className="report-execution-details">
            <summary>查看本场任务交接与工具执行</summary>
            <InterviewExecutionPanel sessionId={reportSessionId} finished />
          </details>
        )}
        <div className="report-summary-grid grid items-start gap-6">
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.38,
              delay: 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <InterviewScoreAndRadarCard
              resumeScore={resumeScore}
              interviewScore={interviewScore}
              compositeScore={compositeScore}
              isCompositeEstimated={isCompositeEstimated}
              radarPoints={radarPoints}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.38,
              delay: 0.18,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <InterviewConclusionCard
              interviewDirection={interviewDirection}
              reviewFeedback={reviewFeedback}
              isRecordLoading={isRecordLoading}
              recordError={recordError}
            />
          </motion.div>
        </div>

        <InterviewNextActionsCard
          reviewFeedback={reviewFeedback}
          sortedSuggestions={sortedSuggestions}
          isRecordLoading={isRecordLoading}
          recordError={recordError}
        />

        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.4, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <InterviewQaReplayCard
            qaReviews={qaReviews}
            isRecordLoading={isRecordLoading}
            recordError={recordError}
          />
        </motion.div>
        {insights && <InterviewSourcesPanel insights={insights} />}
      </div>
    </div>
  );
}
