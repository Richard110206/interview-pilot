import { useLocation, useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ROUTES } from "@/lib/constants";
import {
  buildReportSearch,
  getReportSessionIdFromLocation,
} from "@/lib/interviewReportRoute";
import SidebarInterviewList from "@/components/layout/sidebar/SidebarInterviewList";
import SidebarSessionList from "@/components/layout/sidebar/SidebarSessionList";
import { useSidebarHistoryController } from "@/hooks/layout/useSidebarHistoryController";
import { cn } from "@/lib/utils";

type SidebarHistoryProps = {
  isCollapsed?: boolean;
};

export default function SidebarHistory({ isCollapsed }: SidebarHistoryProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    view,
    setView,
    conversations,
    interviewRecords,
    hasNextPage,
    hasNextInterviewPage,
    isFetchingNextPage,
    isFetchingNextInterviewPage,
    handleScroll,
  } = useSidebarHistoryController(isCollapsed);

  const activeInterviewSessionId = location.pathname.startsWith(
    ROUTES.interviewReport,
  )
    ? getReportSessionIdFromLocation(location)
    : null;

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden px-3">
      <div className="mb-1.5 flex shrink-0 items-center gap-3 border-b border-border px-2 pb-1.5">
        {(
          [
            ["sessions", "历史会话"],
            ["interviews", "历史面试"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setView(value)}
            className={cn(
              "-mb-[7px] border-b-2 pb-1 text-xs transition-colors",
              view === value
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <ScrollArea className="-mx-2 mt-1 flex-1" onScrollCapture={handleScroll}>
        <div className="space-y-0.5 px-2 pb-2">
          {view === "sessions" ? (
            <SidebarSessionList
              conversations={conversations}
              activePathname={location.pathname}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onOpenSession={(sessionId) =>
                navigate(`${ROUTES.chat}/${sessionId}`)
              }
            />
          ) : (
            <SidebarInterviewList
              records={interviewRecords}
              activePathname={location.pathname}
              activeSessionId={activeInterviewSessionId}
              hasNextPage={hasNextInterviewPage}
              isFetchingNextPage={isFetchingNextInterviewPage}
              onOpenRecord={(sessionId) =>
                navigate(
                  `${ROUTES.interviewReport}${buildReportSearch(sessionId)}`,
                  {
                    state: { sessionId },
                  },
                )
              }
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
