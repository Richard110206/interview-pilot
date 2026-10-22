import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  questionBankService,
  type QuestionBankItem,
  type QuestionBankSaveParams,
} from "@/services/questionBankService";
import { Globe2, Pencil, Plus, RefreshCcw, Trash2, Wand2 } from "lucide-react";

const PAGE_SIZE = 10;

const DIFFICULTY_OPTIONS = [1, 2, 3, 4, 5];
const DIFFICULTY_LABELS: Record<number, string> = {
  1: "容易",
  2: "一般",
  3: "中等",
  4: "较难",
  5: "困难",
};
const TYPE_OPTIONS = [
  { value: "CONCEPT", label: "概念" },
  { value: "SCENARIO", label: "场景" },
  { value: "CODING", label: "编码" },
  { value: "PROJECT", label: "项目" },
];
const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TYPE_OPTIONS.map((t) => [t.value, t.label]),
);

const emptyForm: QuestionBankSaveParams = {
  category: "Java后端",
  skillTag: "",
  difficulty: 3,
  questionType: "CONCEPT",
  questionText: "",
  referenceAnswer: "",
  scoringPoints: [],
  status: 1,
  source: "",
};

export default function QuestionBankManagePage() {
  const [items, setItems] = useState<QuestionBankItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<QuestionBankSaveParams>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [expandOpen, setExpandOpen] = useState(false);
  const [expandTag, setExpandTag] = useState("");
  const [expandCategory, setExpandCategory] = useState("Java后端");
  const [expandCount, setExpandCount] = useState(5);
  const [expanding, setExpanding] = useState(false);
  const [expandNote, setExpandNote] = useState("");
  const [rebuilding, setRebuilding] = useState(false);

  const loadPage = useCallback(() => {
    questionBankService
      .pageQuestions({
        pageNum,
        pageSize: PAGE_SIZE,
        keyword: keyword || undefined,
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
  }, [pageNum, keyword]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const openCreate = () => {
    setForm({ ...emptyForm });
    setFormError("");
    setEditOpen(true);
  };

  const openEdit = (question: QuestionBankItem) => {
    setForm({
      id: question.id,
      category: question.category,
      skillTag: question.skillTag,
      difficulty: question.difficulty,
      questionType: question.questionType,
      questionText: question.questionText,
      referenceAnswer: question.referenceAnswer ?? "",
      scoringPoints: question.scoringPoints ?? [],
      status: question.status,
      source: question.source ?? "",
    });
    setFormError("");
    setEditOpen(true);
  };

  const saveForm = () => {
    if (
      !form.category.trim() ||
      !form.skillTag.trim() ||
      !form.questionText.trim()
    ) {
      setFormError("岗位方向、技能标签、题干均不能为空");
      return;
    }
    setSaving(true);
    questionBankService
      .saveOrUpdate(form)
      .then(() => {
        setEditOpen(false);
        loadPage();
      })
      .catch(() => undefined)
      .finally(() => setSaving(false));
  };

  const toggleStatus = (question: QuestionBankItem) => {
    questionBankService
      .updateStatus(question.id, question.status === 1 ? 0 : 1)
      .then(loadPage)
      .catch(() => undefined);
  };

  const removeQuestion = (question: QuestionBankItem) => {
    if (
      !window.confirm(`确认删除该题目？\n${question.questionText.slice(0, 60)}`)
    )
      return;
    questionBankService
      .deleteQuestion(question.id)
      .then(loadPage)
      .catch(() => undefined);
  };

  const runExpand = () => {
    if (!expandTag.trim() || !expandCategory.trim()) return;
    setExpanding(true);
    setExpandNote("");
    questionBankService
      .expand({
        category: expandCategory.trim(),
        skillTag: expandTag.trim(),
        count: expandCount,
      })
      .then((result) =>
        setExpandNote(
          `检索 ${result.searched} 条材料，生成 ${result.generated} 题，新增 ${result.inserted} 题（重复 ${result.skippedDuplicate}，无效 ${result.skippedInvalid}）`,
        ),
      )
      .catch(() => setExpandNote("扩充失败，请稍后重试"))
      .finally(() => {
        setExpanding(false);
        loadPage();
      });
  };

  const rebuild = () => {
    setRebuilding(true);
    questionBankService
      .rebuildIndex()
      .then((count) => window.alert(`向量索引重建完成，共 ${count} 条`))
      .catch(() => undefined)
      .finally(() => setRebuilding(false));
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-8 md:py-10">
        <div className="page-heading flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="app-title">题库管理</h1>
            <p className="app-subtitle num mt-1.5">
              共 {total} 道题 · 增删改查与向量索引联动
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={rebuild} disabled={rebuilding}>
              <RefreshCcw className="mr-1 h-4 w-4" />
              {rebuilding ? "重建中…" : "重建向量索引"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setExpandNote("");
                setExpandOpen(true);
              }}
            >
              <Globe2 className="mr-1 h-4 w-4" />
              联网扩充
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              新增题目
            </Button>
          </div>
        </div>

        <Card className="mt-6 p-3">
          <Input
            value={keyword}
            onChange={(e) => {
              setLoading(true);
              setPageNum(1);
              setKeyword(e.target.value);
            }}
            placeholder="按题干关键词筛选…"
            aria-label="按题干关键词筛选"
            className="h-9 max-w-sm rounded-md"
          />
        </Card>

        <Card className="mt-4">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="num w-16">ID</TableHead>
                  <TableHead>题干</TableHead>
                  <TableHead className="w-20">标签</TableHead>
                  <TableHead className="w-16">难度</TableHead>
                  <TableHead className="w-16">题型</TableHead>
                  <TableHead className="w-24">状态</TableHead>
                  <TableHead className="w-28">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="num text-xs text-muted-foreground">
                      {question.id}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p
                        className="truncate text-sm"
                        title={question.questionText}
                      >
                        {question.questionText}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-normal text-muted-foreground"
                      >
                        {question.skillTag}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {DIFFICULTY_LABELS[question.difficulty] ??
                        question.difficulty}
                    </TableCell>
                    <TableCell className="text-sm">
                      {TYPE_LABELS[question.questionType] ??
                        question.questionType}
                    </TableCell>
                    <TableCell>
                      {question.status === 1 ? (
                        <Badge
                          variant="outline"
                          className="border-transparent bg-primary/5 text-primary"
                        >
                          启用
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-transparent bg-muted text-muted-foreground"
                        >
                          停用
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(question)}
                          aria-label="编辑"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => toggleStatus(question)}
                        >
                          {question.status === 1 ? "禁用" : "启用"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeQuestion(question)}
                          aria-label="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      没有符合条件的题目。
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          <div className="flex items-center justify-between p-3">
            <Button
              variant="outline"
              size="sm"
              disabled={pageNum <= 1}
              onClick={() => setPageNum((p) => Math.max(1, p - 1))}
            >
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
              onClick={() => setPageNum((p) => p + 1)}
            >
              下一页
            </Button>
          </div>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "编辑题目" : "新增题目"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>岗位方向</Label>
                <Input
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>技能标签</Label>
                <Input
                  value={form.skillTag}
                  onChange={(e) =>
                    setForm({ ...form, skillTag: e.target.value })
                  }
                  placeholder="如 并发 / JVM / MySQL"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>难度</Label>
                <Select
                  value={String(form.difficulty)}
                  onValueChange={(v) =>
                    setForm({ ...form, difficulty: Number(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {DIFFICULTY_LABELS[d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>题型</Label>
                <Select
                  value={form.questionType}
                  onValueChange={(v) => setForm({ ...form, questionType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={String(form.status)}
                  onValueChange={(v) => setForm({ ...form, status: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">启用</SelectItem>
                    <SelectItem value="0">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>题干</Label>
              <Textarea
                value={form.questionText}
                onChange={(e) =>
                  setForm({ ...form, questionText: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>参考答案</Label>
              <Textarea
                value={form.referenceAnswer ?? ""}
                onChange={(e) =>
                  setForm({ ...form, referenceAnswer: e.target.value })
                }
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label>评分要点（每行一条）</Label>
              <Textarea
                value={(form.scoringPoints ?? []).join("\n")}
                onChange={(e) =>
                  setForm({
                    ...form,
                    scoringPoints: e.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean),
                  })
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button onClick={saveForm} disabled={saving}>
              {saving ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={expandOpen} onOpenChange={setExpandOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>联网扩充题库</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              按技能标签联网检索真实面经材料，由模型编写题目，自动查重入库并向量化。
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expand-category">岗位方向</Label>
                <Input
                  id="expand-category"
                  value={expandCategory}
                  onChange={(event) => setExpandCategory(event.target.value)}
                  placeholder="如 前端开发、测试开发、Go后端"
                />
                <Label>技能标签</Label>
                <Input
                  value={expandTag}
                  onChange={(e) => setExpandTag(e.target.value)}
                  placeholder="如 并发 / Redis / 网络"
                />
              </div>
              <div className="space-y-2">
                <Label>生成数量（1-10）</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={expandCount}
                  onChange={(e) =>
                    setExpandCount(
                      Math.max(1, Math.min(10, Number(e.target.value) || 5)),
                    )
                  }
                />
              </div>
            </div>
            {expandNote && (
              <p className="num flex items-center gap-1.5 text-xs text-primary">
                <Wand2 className="h-3.5 w-3.5" />
                {expandNote}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpandOpen(false)}>
              关闭
            </Button>
            <Button onClick={runExpand} disabled={expanding}>
              {expanding ? "扩充中（约半分钟）" : "开始扩充"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
