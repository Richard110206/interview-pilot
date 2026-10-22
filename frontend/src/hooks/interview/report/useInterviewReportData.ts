import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { learningService } from "@/services/learningService";
import {
  buildInterviewReportViewModel,
  fetchInterviewReportQueryData,
} from "@/hooks/interview/report/interviewReportData.shared";

export function useInterviewReportData(reportSessionId: string | null) {
  const query = useQuery({
    queryKey: ["interview-record", reportSessionId],
    enabled: Boolean(reportSessionId),
    queryFn: () => fetchInterviewReportQueryData(reportSessionId as string),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const recordError = useMemo(() => {
    if (!query.error) return null;
    return query.error instanceof Error
      ? query.error.message
      : "加载面试报告时发生错误，请稍后重试。";
  }, [query.error]);

  const reportViewModel = useMemo(
    () => buildInterviewReportViewModel(query.data?.record ?? null),
    [query.data?.record],
  );
  const insights = useQuery({
    queryKey: ["interview-insights", reportSessionId],
    enabled: Boolean(reportSessionId) && query.isSuccess,
    queryFn: () => learningService.insights(reportSessionId!),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const measured = insights.data ?? null;
  const model = measured
    ? {
        ...reportViewModel,
        interviewScore: measured.interviewScore,
        compositeScore: measured.compositeScore,
        isCompositeEstimated: false,
        radarPoints: measured.dimensions.map((d) => ({
          label: d.label,
          value: d.value,
        })),
        reviewFeedback: {
          overallComment: measured.primaryCount > 0 ? `本场已作答 ${measured.primaryCount} 道主问题，回答均分 ${measured.interviewScore}。综合分按简历20%与回答80%计算（无简历分时只用回答分）。四维评分记录覆盖 ${measured.dimensionCoverage}/${measured.primaryCount} 道主问题，未包含语音或表情评估。` : "本场尚未提交主问题回答。保留简历评分，不计算回答分和综合分；可以收藏题目，稍后进行专项练习。",
          highlights: measured.dimensions
            .filter((d) => d.value >= 75)
            .map((d) => `${d.label} ${d.value} 分，可以继续用具体例子巩固。`),
          improvementTips: measured.questions
            .filter((q) => !q.followUp && q.score != null && q.score < 75)
            .map((q) => q.feedback || q.question)
            .slice(0, 3),
          nextActions: measured.questions
            .filter((q) => !q.followUp && q.score != null && q.score < 75)
            .map((q) => `再练习：${q.question}`)
            .slice(0, 3),
        },
      }
    : {
        ...reportViewModel,
        compositeScore: reportViewModel.isCompositeEstimated
          ? null
          : reportViewModel.compositeScore,
        isCompositeEstimated: false,
      };

  return {
    isRecordLoading: query.isLoading || query.isFetching,
    recordError,
    ...model,
    insights: insights.data,
    insightsError:
      insights.error instanceof Error ? insights.error.message : null,
    retryReport: () => {
      void query.refetch();
      void insights.refetch();
    },
  };
}
