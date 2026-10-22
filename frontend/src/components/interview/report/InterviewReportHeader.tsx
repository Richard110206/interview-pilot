import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export default function InterviewReportHeader() {
  return (
    <div className="page-heading flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="app-title">面试表现报告</h1>
        <p className="text-sm text-muted-foreground">
          综合评估 · 结果可用于后续训练
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link to={ROUTES.interviewIntro}>重新面试</Link>
        </Button>
      </div>
    </div>
  );
}
