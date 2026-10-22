import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Bookmark, RotateCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  learningService,
  type Insights,
  type Source,
} from "@/services/learningService";
import { ROUTES } from "@/lib/constants";

export function sourceLabel(source: Source) {
  return source.kind === "code"
    ? `源码 · ${source.filePath}:${source.lineStart}—${source.lineEnd}`
    : source.kind === "knowledge"
      ? `${source.title}${source.pageStart ? ` · 第${source.pageStart}页` : " · 页码未记录"}`
      : `原题 #${source.id}`;
}

export function SourceViewer({
  source,
  onClose,
}: {
  source: Source | null;
  onClose: () => void;
}) {
  let points = source?.scoringPoints ?? "";
  try {
    const parsed: unknown = JSON.parse(points);
    if (Array.isArray(parsed)) points = parsed.map(String).join("\n");
  } catch {
    /* Older reference notes may be plain text. */
  }
  return (
    <Dialog
      open={Boolean(source)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl min-w-0 overflow-y-auto">
        <DialogHeader className="min-w-0">
          <DialogTitle className="break-all pr-6">
            {source?.title || "题目参考资料"}
          </DialogTitle>
        </DialogHeader>
        {source && (
          <div className="min-w-0 space-y-5 text-sm leading-7">
            <p className="text-xs text-muted-foreground">
              {source.kind === "code"
                ? `GitHub 源码 · 版本 ${source.commitSha?.slice(0, 12)} · 第${source.lineStart}—${source.lineEnd}行`
                : source.kind === "knowledge"
                  ? `知识片段 #${source.id} · ${source.pageStart ? `PDF 第 ${source.pageStart}${source.pageEnd && source.pageEnd !== source.pageStart ? `—${source.pageEnd}` : ""} 页` : "页码未记录"}`
                  : `题库 #${source.id}`}
            </p>
            <section>
              <h3 className="mb-2 font-semibold">
                {source.kind === "code"
                  ? "出题时引用的代码快照"
                  : source.kind === "knowledge"
                    ? "引用的知识片段"
                    : "原题"}
              </h3>
              {source.kind === "code" ? (
                <pre className="source-code-snapshot">
                  <code>
                    {source.content.split("\n").map((line, index) => (
                      <span key={index}>
                        <span aria-hidden="true">
                          {(source.lineStart || 1) + index}
                        </span>
                        {line}
                        {"\n"}
                      </span>
                    ))}
                  </code>
                </pre>
              ) : (
                <p className="whitespace-pre-wrap">{source.content}</p>
              )}
            </section>
            {source.kind === "code" &&
              source.sourceUrl?.startsWith("https://github.com/") && (
                <a
                  className="inline-flex text-primary underline underline-offset-4"
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  在 GitHub 查看这个版本的原代码 ↗
                </a>
              )}
            {source.referenceAnswer && (
              <section>
                <h3 className="mb-2 font-semibold">参考答案</h3>
                <p className="whitespace-pre-wrap">{source.referenceAnswer}</p>
              </section>
            )}
            {source.scoringPoints && (
              <section>
                <h3 className="mb-2 font-semibold">评分要点</h3>
                <p className="whitespace-pre-wrap">{points}</p>
              </section>
            )}
            <p className="border-t pt-4 text-xs text-muted-foreground">
              {source.sourceNote || "本场出题时保存的资料快照"}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
export default function InterviewSourcesPanel({
  insights,
}: {
  insights: Insights;
}) {
  const client = useQueryClient();
  const [source, setSource] = useState<Source | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const toggle = async (id: string, value: boolean) => {
    setPending(id);
    setError("");
    try {
      await learningService.favorite(id, value);
      await client.invalidateQueries({
        queryKey: ["interview-insights", insights.sessionId],
      });
      await client.invalidateQueries({ queryKey: ["learning-items"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "收藏失败，请重试。");
    } finally {
      setPending(null);
    }
  };
  return (
    <section
      className="report-sources-panel"
      aria-labelledby="report-sources-heading"
    >
      <div className="library-section-heading">
        <div>
          <h2 id="report-sources-heading">从这道题，回到它的依据</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            保存出题时实际引用的资料；生成题和历史缺失来源会明确标记。
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to={ROUTES.learning}>我的练习</Link>
        </Button>
      </div>
      {error && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="space-y-4">
        {insights.questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            本场尚无可追溯题目。完成一次面试后，在这里查看资料与再练习入口。
          </p>
        ) : (
          insights.questions.map((q) => (
            <article key={q.questionNumber} className="source-question">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {q.followUp ? "追问" : "主问题"} {q.questionNumber} ·{" "}
                    {q.origin}
                  </p>
                  <h3 className="mt-2 text-sm font-medium leading-7">
                    {q.question}
                  </h3>
                </div>
                <span className="shrink-0 text-lg font-semibold text-primary">
                  {q.score ?? "未答"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {q.sources.map((s) => (
                  <Button
                    key={s.kind + s.id}
                    variant="outline"
                    size="sm"
                    onClick={() => setSource(s)}
                  >
                    <BookOpen size={14} className="mr-2" />
                    {sourceLabel(s)}
                  </Button>
                ))}
              </div>
              {q.itemId && (
                <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending === q.itemId}
                    onClick={() => void toggle(q.itemId!, !q.favorite)}
                  >
                    <Bookmark
                      size={14}
                      className="mr-2"
                      fill={q.favorite ? "currentColor" : "none"}
                    />
                    {q.favorite ? "已收藏" : "收藏题目"}
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      to={`${ROUTES.learning}?item=${encodeURIComponent(q.itemId)}`}
                    >
                      <RotateCcw size={14} className="mr-2" />
                      针对这题再练习
                    </Link>
                  </Button>
                </div>
              )}
            </article>
          ))
        )}
      </div>
      <SourceViewer source={source} onClose={() => setSource(null)} />
    </section>
  );
}
