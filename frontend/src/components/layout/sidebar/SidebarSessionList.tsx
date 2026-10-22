import { cn } from "@/lib/utils";
import type { AiConversation } from "@/types/ai";

type SidebarSessionListProps = {
  conversations: AiConversation[];
  activePathname: string;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  onOpenSession: (sessionId: string) => void;
};

export default function SidebarSessionList({
  conversations,
  activePathname,
  hasNextPage,
  isFetchingNextPage,
  onOpenSession,
}: SidebarSessionListProps) {
  return (
    <>
      {conversations.map((conversation) => {
        const active = activePathname.includes(conversation.sessionId);
        return (
          <button
            key={conversation.sessionId}
            type="button"
            onClick={() => onOpenSession(conversation.sessionId)}
            className={cn(
              "flex w-full flex-col gap-0.5 rounded-md px-2 py-2 text-left transition-colors",
              active
                ? "bg-secondary"
                : "hover:bg-accent",
            )}
          >
            <span
              className={cn(
                "truncate text-[13px] font-medium",
                active ? "text-foreground" : "text-foreground/90",
              )}
            >
              {conversation.title || "无标题会话"}
            </span>
            <span className="num truncate text-xs text-muted-foreground">
              {conversation.createTime
                ? new Date(conversation.createTime).toLocaleDateString()
                : "未知日期"}{" "}
              · {conversation.aiName || "未知模型"}
            </span>
          </button>
        );
      })}

      {isFetchingNextPage ? (
        <div className="py-2 text-center text-xs text-muted-foreground">
          加载中…
        </div>
      ) : null}

      {!hasNextPage && conversations.length > 0 ? (
        <div className="py-2 text-center text-xs text-muted-foreground/70">
          没有更多了
        </div>
      ) : null}

      {!isFetchingNextPage && conversations.length === 0 ? (
        <div className="py-4 text-center text-xs text-muted-foreground">
          暂无会话记录
        </div>
      ) : null}
    </>
  );
}
