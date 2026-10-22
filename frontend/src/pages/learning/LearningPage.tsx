import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Bookmark, BookOpen, Loader2 } from "lucide-react";
import {
  learningService,
  type StudyItem,
  type Source,
} from "@/services/learningService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  SourceViewer,
  sourceLabel,
} from "@/components/interview/report/InterviewSourcesPanel";
import { ROUTES } from "@/lib/constants";
import StudyArtwork from "@/components/brand/StudyArtwork";

const labels: Record<string, string> = {
  accuracy: "技术准确性",
  completeness: "要点完整性",
  reasoning: "分析与取舍",
  expression: "表达清晰度",
};
export function PracticeWorkspace({ item }: { item: StudyItem }) {
  const client = useQueryClient();
  const [answer, setAnswer] = useState("");
  const [source, setSource] = useState<Source | null>(null);
  const [favoriteError, setFavoriteError] = useState("");
  const request = useRef<{ answer: string; id: string } | null>(null);
  const history = useQuery({
    queryKey: ["learning-attempts", item.id],
    queryFn: () => learningService.attempts(item.id),
  });
  const favorite = useMutation({
    mutationFn: () => learningService.favorite(item.id, !item.favorite),
    onSuccess: async () => {
      setFavoriteError("");
      await client.invalidateQueries({ queryKey: ["learning-items"] });
      await client.invalidateQueries({ queryKey: ["learning-item", item.id] });
    },
    onError: (e) => setFavoriteError(e.message),
  });
  const grade = useMutation({
    mutationFn: async () => {
      if (!request.current || request.current.answer !== answer)
        request.current = { answer, id: crypto.randomUUID() };
      return learningService.submit(item.id, answer, request.current.id);
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["learning-items"] }),
        client.invalidateQueries({ queryKey: ["learning-item", item.id] }),
        client.invalidateQueries({ queryKey: ["learning-attempts", item.id] }),
      ]);
    },
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (answer.trim() && !grade.isPending) grade.mutate();
  };
  return (
    <section
      className="practice-workspace"
      id="practice-workspace"
      aria-labelledby="practice-question-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          专项练习 · 本题最新得分 {item.latestScore ?? "未答"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={favorite.isPending}
          onClick={() => favorite.mutate()}
        >
          <Bookmark
            size={14}
            className="mr-2"
            fill={item.favorite ? "currentColor" : "none"}
          />
          {item.favorite ? "已收藏" : "收藏"}
        </Button>
      </div>
      {favoriteError && (
        <p role="alert" className="text-sm text-destructive">
          {favoriteError}
        </p>
      )}
      <h2
        id="practice-question-heading"
        className="mt-4 text-lg font-semibold leading-8"
      >
        {item.question}
      </h2>
      <form className="mt-5" onSubmit={submit}>
        <label htmlFor="practice-answer" className="text-sm font-medium">
          这一次，你会怎样回答？
        </label>
        <Textarea
          id="practice-answer"
          className="mt-3 min-h-44"
          maxLength={12000}
          value={answer}
          disabled={grade.isPending}
          onChange={(event) => {
            setAnswer(event.target.value);
            if (grade.data) grade.reset();
          }}
          placeholder="围绕问题说明原理、做法和取舍…"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button disabled={!answer.trim() || grade.isPending}>
            {grade.isPending ? (
              <>
                <Loader2 size={15} className="mr-2 animate-spin" />
                正在评分…
              </>
            ) : grade.isError ? (
              "重试本次评分"
            ) : (
              "提交练习回答"
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            按四维标准评分，不影响原面试报告
          </span>
        </div>
      </form>
      {grade.error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {grade.error.message}。重试会沿用同一次请求。
        </p>
      )}
      {grade.data && (
        <div className="practice-result" role="status">
          <h3 className="font-semibold">
            本次练习 {grade.data.score} 分
            {grade.data.previousScore != null
              ? ` · 上次 ${grade.data.previousScore} 分`
              : ""}
          </h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
            {grade.data.feedback}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(grade.data.dimensions).map(([key, value]) => (
              <div key={key}>
                <p className="flex justify-between text-xs">
                  <span>{labels[key] ?? key}</span>
                  <span>{value}</span>
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                  <div
                    style={{ width: `${value}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            ))}
          </div>
          {grade.data.missing_points?.length > 0 && (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
              {grade.data.missing_points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <details className="mt-6 border-t pt-4">
        <summary className="cursor-pointer text-sm font-medium">
          查看上次作答与反馈
        </summary>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
          {item.answer || "尚未作答"}
        </p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
          {item.feedback}
        </p>
      </details>
      <div className="mt-5 flex flex-wrap gap-2">
        {item.sources.map((s) => (
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
      <section className="mt-7 border-t pt-5">
        <h3 className="text-sm font-semibold">这道题的练习记录</h3>
        {history.isLoading ? (
          <p className="mt-3 text-xs text-muted-foreground">
            正在读取练习记录…
          </p>
        ) : history.error ? (
          <Button variant="link" onClick={() => void history.refetch()}>
            读取失败，点击重试
          </Button>
        ) : !history.data?.length ? (
          <p className="mt-3 text-xs text-muted-foreground">
            提交第一次专项练习后，会在这里保留评分记录。
          </p>
        ) : (
          <ol className="mt-3 space-y-3">
            {history.data.map((attempt) => {
              let score: unknown;
              try {
                score = JSON.parse(attempt.resultJson).score;
              } catch {
                score = "—";
              }
              return (
                <li
                  className="flex justify-between gap-3 text-sm"
                  key={attempt.id}
                >
                  <time>
                    {new Date(attempt.createdAt).toLocaleString("zh-CN")}
                  </time>
                  <strong>{String(score)} 分</strong>
                </li>
              );
            })}
          </ol>
        )}
      </section>
      <SourceViewer source={source} onClose={() => setSource(null)} />
    </section>
  );
}

export default function LearningPage() {
  const [params, setParams] = useSearchParams();
  const client = useQueryClient();
  const selected = params.get("item");
  const incomingTarget = useRef(Boolean(selected));
  const [filter, setFilter] = useState(selected ? "all" : "weak");
  const [direction, setDirection] = useState("");
  const history = useQuery({
    queryKey: ["learning-history"],
    queryFn: learningService.history,
    refetchOnWindowFocus: false,
  });
  const items = useQuery({
    queryKey: ["learning-items", filter],
    queryFn: () => learningService.items(filter),
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (history.isSuccess)
      void client.invalidateQueries({ queryKey: ["learning-items"] });
  }, [history.dataUpdatedAt, history.isSuccess, client]);
  const selection = useQuery({
    queryKey: ["learning-item", selected],
    queryFn: () => learningService.item(selected!),
    enabled: Boolean(selected),
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (incomingTarget.current && selection.data?.id) {
      const workspace = document.getElementById("practice-workspace");
      if (workspace) {
        incomingTarget.current = false;
        workspace.scrollIntoView({ block: "start" });
      }
    }
  }, [selection.data?.id, items.isLoading]);
  useEffect(() => {
    if (!selected && items.data?.length)
      setParams({ item: items.data[0].id }, { replace: true });
  }, [selected, items.data, setParams]);
  const rows = (history.data ?? []).filter(
    (row) => !direction || row.direction === direction,
  );
  const directions = [
    ...new Set(
      (history.data ?? [])
        .map((row) => row.direction)
        .filter((v): v is string => Boolean(v)),
    ),
  ];
  return (
    <div className="library-page h-full overflow-y-auto">
      <div className="library-shell mx-auto max-w-6xl">
        <header className="page-heading flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="app-title">我的练习</h1>
            <p className="app-subtitle mt-2">把反馈变成下一次回答的进步。</p>
          </div>
          <Button asChild variant="outline">
            <Link to={ROUTES.interviewIntro}>开始新的面试</Link>
          </Button>
        </header>
        <section className="learning-comparison">
          <div className="library-section-heading">
            <div>
              <h2>最近 20 场面试对比</h2>
              <p className="mt-2 text-xs text-muted-foreground">
                以已作答主问题均分比较；不同岗位、题目难度与评分版本会影响可比性。
              </p>
            </div>
            <select
              aria-label="比较岗位方向"
              value={direction}
              onChange={(event) => setDirection(event.target.value)}
              className="max-w-full rounded-lg border bg-white px-3 py-2 text-sm"
            >
              <option value="">全部方向</option>
              {directions.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          {history.isLoading ? (
            <p className="text-sm text-muted-foreground">正在整理面试记录…</p>
          ) : history.error ? (
            <div role="alert" className="text-sm">
              {history.error.message}
              <Button variant="link" onClick={() => void history.refetch()}>
                重试
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              完成并查看一次面试报告后，这里会开始记录成长。
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="learning-history-table">
                <thead>
                  <tr>
                    <th>面试</th>
                    <th>方向</th>
                    <th>已答主问题</th>
                    <th>回答分</th>
                    <th>评分版本</th>
                    <th>与上次同方向同版本相比</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const prev = rows
                      .slice(index + 1)
                      .find(
                        (other) =>
                          other.direction === row.direction &&
                          other.gradingPolicy === row.gradingPolicy,
                      );
                    const delta = prev
                      ? row.interviewScore - prev.interviewScore
                      : null;
                    return (
                      <tr key={row.sessionId}>
                        <td>
                          <Link
                            className="text-primary hover:underline"
                            to={`${ROUTES.interviewReport}?sessionId=${encodeURIComponent(row.sessionId)}`}
                          >
                            {row.date
                              ? new Date(row.date).toLocaleDateString("zh-CN")
                              : "查看报告"}
                          </Link>
                        </td>
                        <td>{row.direction || "未标注"}</td>
                        <td>{row.primaryCount}</td>
                        <td>
                          <div className="comparison-score">
                            <b>{row.interviewScore}</b>
                            <span>
                              <i style={{ width: `${row.interviewScore}%` }} />
                            </span>
                          </div>
                        </td>
                        <td>
                          {row.gradingPolicy === "text-v1"
                            ? "四维 v1"
                            : "历史评分"}
                        </td>
                        <td>
                          {delta === null
                            ? "—"
                            : `${delta > 0 ? "+" : ""}${delta} 分`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <div className="learning-filters" role="group" aria-label="练习筛选">
          {[
            ["weak", "待巩固"],
            ["wrong", "错题"],
            ["favorite", "收藏"],
            ["all", "全部"],
          ].map(([value, label]) => (
            <Button
              key={value}
              variant={filter === value ? "default" : "outline"}
              aria-pressed={filter === value}
              onClick={() => {
                setFilter(value);
                setParams({});
              }}
            >
              {label}
            </Button>
          ))}
          <p className="text-xs text-muted-foreground">
            错题低于60分，待巩固低于75分；重新作答后按最新成绩更新。
          </p>
        </div>
        {items.isLoading ? (
          <p role="status" className="py-8 text-sm text-muted-foreground">
            正在读取练习题目…
          </p>
        ) : items.error ? (
          <p role="alert" className="py-8 text-sm">
            {items.error.message}
            <Button variant="link" onClick={() => void items.refetch()}>
              重试
            </Button>
          </p>
        ) : (
          <div className="learning-workbench">
            <div className="learning-item-rail">
              <nav aria-label="练习题目列表" className="learning-item-list">
                {!items.data?.length ? (
                  <div className="p-5 text-sm leading-7 text-muted-foreground">
                    这里还没有题目。你可以先完成一次面试，或到报告中收藏想练的题目。
                  </div>
                ) : (
                  items.data.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      aria-current={selected === item.id ? "true" : undefined}
                      onClick={() => setParams({ item: item.id })}
                    >
                      <span className="line-clamp-3 text-sm leading-6">
                        {item.question}
                      </span>
                      <span className="mt-3 flex justify-between text-xs text-muted-foreground">
                        <span>{item.favorite ? "已收藏" : "专项练习"}</span>
                        <span>
                          {item.latestScore == null
                            ? "未答"
                            : `${item.latestScore} 分`}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </nav>
            </div>
            <div className="min-w-0">
              {selection.isLoading ? (
                <p className="p-8 text-sm">正在读取题目…</p>
              ) : selection.error ? (
                <p role="alert" className="p-8 text-sm">
                  {selection.error.message}
                  <Button
                    variant="link"
                    onClick={() => void selection.refetch()}
                  >
                    重试
                  </Button>
                </p>
              ) : selection.data ? (
                <PracticeWorkspace
                  key={selection.data.id}
                  item={selection.data}
                />
              ) : (
                <div className="practice-workspace practice-welcome">
                  <StudyArtwork />
                  <h2 className="display-heading text-2xl">
                    下一次回答，从这里开始。
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    选择左侧题目，在自己的理解里重新组织一次答案。
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
