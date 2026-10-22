import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  Search,
  Sparkles,
} from "lucide-react";
import service from "@/lib/request";

type ExecutionEvent = {
  id: string;
  stage: string;
  label: string;
  tool: string;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "DEGRADED";
  startedAt: number;
  durationMs?: number;
  count?: number;
  references: string[];
  summary: string;
};
type Props = { sessionId?: string | null; finished?: boolean; busy?: boolean };

export default function InterviewExecutionPanel({
  sessionId,
  finished,
  busy,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const { data = [], isError } = useQuery({
    queryKey: ["interview-execution", sessionId],
    queryFn: () =>
      service.get<ExecutionEvent[]>(
        `/xunzhi/v1/interview/sessions/${encodeURIComponent(sessionId!)}/execution`,
      ),
    enabled: Boolean(sessionId),
    refetchInterval: finished ? false : busy ? 800 : 2200,
    retry: false,
  });
  const byId = new Map<string, ExecutionEvent>();
  data.forEach((event) => {
    if (!byId.has(event.id)) byId.set(event.id, event);
  });
  const events = [...byId.values()].sort((a, b) => a.startedAt - b.startedAt);
  const live = events.filter((event) => event.status === "RUNNING").at(-1);
  const phases = [
    { key: "resume", label: "读材料", icon: FileText },
    { key: "analysis", label: "做计划", icon: Sparkles },
    { key: "retrieval", label: "找依据", icon: Search },
    { key: "question", label: "提问题", icon: Sparkles },
    { key: "answer", label: "看回答", icon: Activity },
  ];
  const latestRetrieval = [...events]
    .reverse()
    .filter((event) => event.stage === "retrieval");
  const bank = latestRetrieval.find((event) => event.tool === "题库向量检索");
  const knowledge = latestRetrieval.find(
    (event) => event.tool === "知识文档向量检索",
  );
  return (
    <section className="execution-panel" aria-label="面试执行过程">
      <header>
        <div>
          <Activity size={16} />
          <h3>本场思路</h3>
        </div>
        <span className={live ? "execution-live" : ""}>
          {live ? "处理中" : events.length ? "已同步" : "等待开始"}
        </span>
      </header>
      <div className="execution-path">
        {phases.map(({ key, label, icon: Icon }) => {
          const relevant = events.filter((event) =>
            key === "answer"
              ? ["evaluation", "followup"].includes(event.stage)
              : key === "resume"
                ? event.stage === "resume" ||
                  event.tool === "GitHub 官方只读下载"
                : event.stage === key,
          );
          const current = relevant.some((event) => event.status === "RUNNING");
          const done = relevant.some((event) => event.status === "COMPLETED");
          return (
            <div
              key={key}
              data-status={current ? "active" : done ? "done" : "pending"}
            >
              <span>
                {done && !current ? <Check size={14} /> : <Icon size={14} />}
              </span>
              <p>{label}</p>
            </div>
          );
        })}
      </div>
      <p className="execution-current" role="status">
        {isError
          ? "暂时无法读取过程记录"
          : (live?.label ??
            (events.length
              ? events.at(-1)?.summary
              : "提供简历或项目后，在这里看见提问的依据"))}
      </p>
      <div className="execution-evidence">
        <div>
          <Search size={14} />
          <span>题库考点</span>
          <b>
            {bank?.count ?? "—"}
            <small> 题</small>
          </b>
        </div>
        <div>
          <BookOpen size={14} />
          <span>知识片段</span>
          <b>
            {knowledge?.count ?? "—"}
            <small> 段</small>
          </b>
        </div>
      </div>
      {events.length > 0 && (
        <>
          <button
            type="button"
            className="execution-expand"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "收起本场轨迹" : "查看本场轨迹"}
            <ChevronDown size={14} className={expanded ? "rotate-180" : ""} />
          </button>
          {expanded && (
            <ol className="execution-events">
              {events.slice(-14).map((event) => (
                <li key={event.id} data-state={event.status}>
                  <span className="execution-node" />
                  <div>
                    <strong>{event.label}</strong>
                    <p>
                      {event.tool}
                      {event.durationMs != null
                        ? ` · ${(event.durationMs / 1000).toFixed(1)}s`
                        : ""}
                    </p>
                    {event.references.length > 0 && (
                      <span className="execution-refs">
                        {event.references.slice(0, 4).join("、")}
                      </span>
                    )}
                    <p>
                      {event.status === "FAILED"
                        ? "本步未完成"
                        : event.status === "DEGRADED"
                          ? "已降级继续"
                          : event.status === "RUNNING"
                            ? "进行中"
                            : event.summary}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
      <p className="execution-note">展示实际检索与生成步骤</p>
    </section>
  );
}
