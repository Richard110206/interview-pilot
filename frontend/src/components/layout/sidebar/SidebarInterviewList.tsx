import { cn } from "@/lib/utils";
import type { InterviewRecordResult } from "@/services/interviewService";
import { ROUTES } from "@/lib/constants";

type SidebarInterviewListProps = {
  records: InterviewRecordResult[];
  activePathname: string;
  activeSessionId: string | null;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  onOpenRecord: (sessionId: string) => void;
};

const formatDate = (value?: string | null) => {
  if (!value) return "未知日期";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString();
};

const formatScore = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return String(value);
};

export default function SidebarInterviewList({
  records,
  activePathname,
  activeSessionId,
  hasNextPage,
  isFetchingNextPage,
  onOpenRecord,
}: SidebarInterviewListProps) {
  return (
    <>
      {records.map((record) => {
        const isActive =
          activePathname.startsWith(ROUTES.interviewReport) &&
          activeSessionId === record.sessionId;

        return (
          <button
            key={record.sessionId}
            type="button"
            onClick={() => onOpenRecord(record.sessionId)}
            className={cn(
              "flex w-full flex-col gap-0.5 rounded-md px-2 py-2 text-left transition-colors",
              isActive ? "bg-secondary" : "hover:bg-accent",
            )}
          >
            <span
              className={cn(
                "truncate text-[13px] font-medium",
                isActive ? "text-foreground" : "text-foreground/90",
              )}
            >
              {record.interviewDirection || "面试记录"}
            </span>
            <span className="num truncate text-xs text-muted-foreground">
              {formatDate(record.startTime || record.createTime)} · 得分{" "}
              {formatScore(record.interviewScore)}
            </span>
          </button>
        );
      })}

      {isFetchingNextPage ? (
        <div className="py-2 text-center text-xs text-muted-foreground">
          加载中…
        </div>
      ) : null}

      {!hasNextPage && records.length > 0 ? (
        <div className="py-2 text-center text-xs text-muted-foreground/70">
          没有更多了
        </div>
      ) : null}

      {!isFetchingNextPage && records.length === 0 ? (
        <div className="py-4 text-center text-xs text-muted-foreground">
          暂无面试记录
        </div>
      ) : null}
    </>
  );
}
