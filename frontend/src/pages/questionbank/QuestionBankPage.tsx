import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import QuestionBookmarkButton from "@/components/interview/QuestionBookmarkButton";
import { ROUTES } from "@/lib/constants";
import {
  questionBankService,
  type QuestionBankItem,
  type QuestionBankSearchHit,
} from "@/services/questionBankService";
import { cn } from "@/lib/utils";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "容易",
  2: "一般",
  3: "中等",
  4: "较难",
  5: "困难",
};

const TYPE_LABELS: Record<string, string> = {
  CONCEPT: "概念",
  SCENARIO: "场景",
  CODING: "编码",
  PROJECT: "项目",
};

const PAGE_SIZE = 8;

export default function QuestionBankPage() {
  const [tags, setTags] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [roleCategory, setRoleCategory] = useState("");
  const [activeTag, setActiveTag] = useState<string>("");
  const [items, setItems] = useState<QuestionBankItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [semanticQuery, setSemanticQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<QuestionBankSearchHit[] | null>(null);

  useEffect(() => {
    questionBankService
      .countByCategory()
      .then(setCategories)
      .catch(() => setCategories({}));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const request = questionBankService.countBySkillTag(
      roleCategory || undefined,
    );
    request
      .then((data) => {
        if (!cancelled) setTags(data);
      })
      .catch(() => {
        if (!cancelled) setTags({});
      });
    return () => {
      cancelled = true;
    };
  }, [roleCategory]);

  const loadPage = useCallback(
    (page: number, tag: string) => {
      questionBankService
        .pageQuestions({
          pageNum: page,
          pageSize: PAGE_SIZE,
          skillTag: tag || undefined,
          category: roleCategory || undefined,
          status: 1,
        })
        .then((data) => {
          setItems(data?.records ?? []);
          setTotal(data?.total ?? 0);
        })
        .catch(() => {
          setItems([]);
          setTotal(0);
        })
        .finally(() => setLoading(false));
    },
    [roleCategory],
  );

  useEffect(() => {
    loadPage(pageNum, activeTag);
  }, [pageNum, activeTag, loadPage]);

  const selectTag = (tag: string) => {
    setLoading(true);
    setActiveTag(tag);
    setPageNum(1);
    setHits(null);
  };

  const runSemanticSearch = () => {
    const query = semanticQuery.trim();
    if (!query) return;
    setSearching(true);
    questionBankService
      .searchQuestions(
        roleCategory ? `${roleCategory} ${query}` : query,
        roleCategory ? 20 : 5,
      )
      .then((data) =>
        setHits(
          (data ?? [])
            .filter((hit) => !roleCategory || hit.category === roleCategory)
            .slice(0, 5),
        ),
      )
      .catch(() => setHits([]))
      .finally(() => setSearching(false));
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const tagEntries = Object.entries(tags);
  const totalAll = Object.values(tags).reduce((a, b) => a + b, 0);

  return (
    <div className="library-page question-page h-full overflow-y-auto">
      <div className="library-shell mx-auto max-w-6xl px-6 py-8 md:px-8 md:py-10">
        <div className="page-heading flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="app-title">面试题库</h1>
            <p className="app-subtitle num mt-1.5">
              按技术方向复习，也让题库考点走进你的模拟面试。
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="num text-sm text-primary">
              <strong className="mr-1 text-2xl">
                {Object.values(categories).reduce(
                  (sum, count) => sum + count,
                  0,
                )}
              </strong>{" "}
              道面试题
            </p>
          </div>
        </div>

        <section className="practice-banner mt-5">
          <div>
            <h2>在项目里遇见考点，在对话里练懂原理</h2>
            <p>
              上传简历后，面试会围绕项目穿插相关八股和场景问题。这里也可以单独查看考点与参考答案。
            </p>
          </div>
          <Button asChild>
            <Link to={ROUTES.interviewIntro}>
              开始混合面试
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </section>
        <div className="question-workbench mt-5 grid gap-6 lg:grid-cols-[190px_1fr]">
          <nav
            className="h-fit rounded-xl border bg-secondary/40 p-4"
            aria-label="技能方向筛选"
          >
            <div className="question-role-controls">
              <label htmlFor="question-role" className="text-sm font-medium">
                岗位方向
              </label>
              <select
                id="question-role"
                value={roleCategory}
                className="h-10 max-w-full rounded-lg border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onChange={(event) => {
                  setLoading(true);
                  setRoleCategory(event.target.value);
                  setActiveTag("");
                  setPageNum(1);
                  setHits(null);
                  setExpandedId(null);
                }}
              >
                <option value="">全部岗位</option>
                {Object.entries(categories).map(([name, count]) => (
                  <option key={name} value={name}>
                    {name}（{count}）
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                本地资料整理与改编，题目可查看来源
              </p>
            </div>

            <p className="section-label mb-2">技能方向</p>
            <ul className="space-y-0.5">
              <li>
                <button
                  type="button"
                  onClick={() => selectTag("")}
                  className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md px-2 text-sm transition-colors",
                    activeTag === ""
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground/85 hover:bg-accent",
                  )}
                >
                  全部
                  <span className="num text-xs text-muted-foreground">
                    {totalAll}
                  </span>
                </button>
              </li>
              {tagEntries.map(([name, count]) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => selectTag(name)}
                    className={cn(
                      "flex h-10 w-full items-center justify-between rounded-md px-2 text-sm transition-colors",
                      activeTag === name
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-foreground/85 hover:bg-accent",
                    )}
                  >
                    {name}
                    <span className="num text-xs text-muted-foreground">
                      {count}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="question-results min-w-0 space-y-5">
            <div className="library-search">
              <h2>找到这一次想练的考点</h2>
              <div className="flex gap-2">
                <Input
                  value={semanticQuery}
                  onChange={(e) => setSemanticQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runSemanticSearch()}
                  placeholder="用一句话描述考点，如：线程池参数是怎么工作的"
                  aria-label="语义检索"
                  className="h-9 flex-1 rounded-md"
                />
                <Button
                  onClick={runSemanticSearch}
                  disabled={searching}
                  className="h-9"
                >
                  {searching ? "检索中…" : "语义检索"}
                </Button>
              </div>
              {hits && (
                <div className="mt-3 space-y-1.5">
                  {hits.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      未找到相关真题，换个说法试试。
                    </p>
                  )}
                  {hits.map((hit) => (
                    <div
                      key={hit.id}
                      className="flex items-start justify-between gap-4 rounded-md bg-muted px-3 py-2"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm leading-relaxed text-foreground">
                          {hit.questionText}
                        </p>
                        <p className="num text-xs text-muted-foreground">
                          {hit.skillTag} ·{" "}
                          {DIFFICULTY_LABELS[hit.difficulty] ?? hit.difficulty}{" "}
                          · 题库 #{hit.id}
                        </p>
                      </div>
                      <span className="num shrink-0 text-sm font-medium text-primary">
                        {(hit.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">
                该方向暂无题目，可到管理页录入或联网扩充。
              </Card>
            ) : (
              <ul className="space-y-3">
                {items.map((question) => (
                  <li key={question.id}>
                    <Card className="p-5 transition-colors hover:border-primary/30">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-2">
                          <p className="text-[15px] font-medium leading-relaxed text-foreground">
                            {question.questionText}
                          </p>
                          <div className="num flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>{question.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{question.skillTag}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {DIFFICULTY_LABELS[question.difficulty] ??
                                `难度 ${question.difficulty}`}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {TYPE_LABELS[question.questionType] ??
                                question.questionType}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>题库 #{question.id}</span>
                          </div>
                          <QuestionBookmarkButton id={question.id} question={question.questionText}/>
                          {question.referenceAnswer && (
                            <div className="pt-0.5">
                              <button
                                type="button"
                                className="inline-flex min-h-8 items-center gap-1 text-xs text-primary transition-colors hover:text-foreground"
                                onClick={() =>
                                  setExpandedId(
                                    expandedId === question.id
                                      ? null
                                      : question.id,
                                  )
                                }
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                                {expandedId === question.id
                                  ? "收起参考答案"
                                  : "查看参考答案"}
                              </button>
                              {expandedId === question.id && (
                                <div className="mt-2 border-l-2 border-border pl-3">
                                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                                    {question.referenceAnswer}
                                  </p>
                                  {question.scoringPoints?.length ? (
                                    <ul className="mt-3 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
                                      {question.scoringPoints.map((point) => (
                                        <li key={point}>{point}</li>
                                      ))}
                                    </ul>
                                  ) : null}
                                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                                    来源：{question.source || "未标注"}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {question.difficulty >= 4 && (
                          <Badge
                            variant="outline"
                            className="shrink-0 border-border bg-muted text-foreground"
                          >
                            较难
                          </Badge>
                        )}
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={pageNum <= 1}
                onClick={() => {
                  setLoading(true);
                  setPageNum((p) => Math.max(1, p - 1));
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </Button>
              <span className="num text-xs text-muted-foreground">
                {total === 0
                  ? "0 题"
                  : `${(pageNum - 1) * PAGE_SIZE + 1}-${Math.min(pageNum * PAGE_SIZE, total)} / ${total} 题`}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pageNum >= totalPages}
                onClick={() => {
                  setLoading(true);
                  setPageNum((p) => p + 1);
                }}
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
