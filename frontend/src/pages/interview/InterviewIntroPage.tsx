import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import InterviewIntroHighlights from "@/components/interview/intro/InterviewIntroHighlights";
import StudyArtwork from "@/components/brand/StudyArtwork";
import InterviewIntroStepsCard from "@/components/interview/intro/InterviewIntroStepsCard";
import {
  DEFAULT_INTERVIEW_INTRO_LOCALE,
  getInterviewIntroCopy,
} from "@/components/interview/intro/introCopy";
import {
  interviewService,
  type InterviewConversationItem,
} from "@/services/interviewService";

const ACTIVE_INTERVIEW_STATUSES = new Set([
  "DRAFT",
  "RESUME_UPLOADING",
  "READY",
  "IN_PROGRESS",
]);

export default function InterviewIntroPage() {
  const [latestActiveSession, setLatestActiveSession] =
    useState<InterviewConversationItem | null>(null);
  const introCopy = useMemo(
    () => getInterviewIntroCopy(DEFAULT_INTERVIEW_INTRO_LOCALE),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const loadLatestActiveSession = async () => {
      try {
        const response = await interviewService.pageInterviewConversations({
          current: 1,
          size: 10,
        });
        if (cancelled) {
          return;
        }
        const activeSession =
          response.records.find((item) =>
            item.status ? ACTIVE_INTERVIEW_STATUSES.has(item.status) : false,
          ) ?? null;
        setLatestActiveSession(activeSession);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load latest interview session:", error);
        }
      }
    };

    void loadLatestActiveSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="interview-intro-page h-full overflow-y-auto">
      <div className="library-shell mx-auto max-w-6xl px-6 py-8 md:px-8">
        <div className="intro-workbench grid items-stretch gap-7 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="intro-welcome space-y-7 rounded-2xl border bg-secondary/40 p-6 md:p-8">
            <div className="space-y-3">
              <h1 className="display-heading text-3xl font-semibold leading-snug tracking-tight text-foreground md:text-4xl">
                {introCopy.title}
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground">
                {introCopy.description}
              </p>
            </div>

            <InterviewIntroHighlights highlights={introCopy.highlights} />

            <div className="flex flex-wrap gap-3 pt-1">
              {latestActiveSession ? (
                <Button asChild>
                  <Link
                    to={`${ROUTES.interviewRoom}/${encodeURIComponent(latestActiveSession.sessionId)}`}
                  >
                    {introCopy.continueButton}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
              <Button
                asChild
                variant={latestActiveSession ? "outline" : "default"}
              >
                <Link to={ROUTES.interviewRoom}>
                  {introCopy.startButton}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={ROUTES.questionBank}>{introCopy.reviewButton}</Link>
              </Button>
            </div>
            <div className="intro-preparation border-t border-primary/15 pt-5">
              <div>
                <h2 className="text-sm font-semibold">
                  开始前，准备这些就够了
                </h2>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <li>一份可提取文字的 PDF 简历</li>
                  <li>一个你愿意展开介绍的项目或实践经历</li>
                  <li>不必背好答案，按实际理解用文字作答</li>
                </ul>
                <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                  摄像头按需开启，仅用于预览。每场练习的题目会根据你的简历生成。
                </p>
              </div>
              <StudyArtwork />
            </div>
          </div>

          <InterviewIntroStepsCard
            title={introCopy.processTitle}
            steps={introCopy.steps}
            updateTitle={introCopy.processUpdateTitle}
            updateDescription={introCopy.processUpdateDescription}
          />
        </div>
      </div>
    </div>
  );
}
