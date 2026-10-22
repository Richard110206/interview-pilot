import { useCallback, useEffect, useRef, useState } from "react";
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
  knowledgeService,
  type KnowledgeDocumentItem,
  type KnowledgeSearchHit,
} from "@/services/knowledgeService";
import { RefreshCcw, Trash2, Upload } from "lucide-react";

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<KnowledgeDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [password, setPassword] = useState("");
  const [sourceNote, setSourceNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<KnowledgeSearchHit[] | null>(null);

  const [previewDoc, setPreviewDoc] = useState<KnowledgeDocumentItem | null>(
    null,
  );
  const [previewText, setPreviewText] = useState("");

  const loadDocuments = useCallback(() => {
    knowledgeService
      .listDocuments()
      .then((data) => setDocuments(data ?? []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const submitUpload = () => {
    if (!file) {
      setUploadError("请选择 PDF 文件");
      return;
    }
    setUploading(true);
    setUploadError("");
    knowledgeService
      .uploadDocument({
        file,
        title: title || undefined,
        category: category || undefined,
        password: password || undefined,
        sourceNote: sourceNote || undefined,
      })
      .then(() => {
        setUploadOpen(false);
        setFile(null);
        setTitle("");
        setCategory("");
        setPassword("");
        setSourceNote("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        loadDocuments();
      })
      .catch((error) => {
        setUploadError(
          error instanceof Error ? error.message : "上传失败，请重试",
        );
      })
      .finally(() => setUploading(false));
  };

  const removeDocument = (doc: KnowledgeDocumentItem) => {
    if (!window.confirm(`确认删除文档《${doc.title}》及其全部切块与向量？`))
      return;
    knowledgeService
      .deleteDocument(doc.id)
      .then(loadDocuments)
      .catch(() => undefined);
  };

  const rebuild = () => {
    setRebuilding(true);
    knowledgeService
      .rebuildIndex()
      .then((count) => window.alert(`知识索引重建完成，共 ${count} 块`))
      .catch(() => undefined)
      .finally(() => setRebuilding(false));
  };

  const runSearch = () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    knowledgeService
      .searchKnowledge(q, 4)
      .then((data) => setHits(data ?? []))
      .catch(() => setHits([]))
      .finally(() => setSearching(false));
  };

  const openPreview = (doc: KnowledgeDocumentItem) => {
    setPreviewDoc(doc);
    setPreviewText("加载中…");
    knowledgeService
      .chunksPreview(doc.id, 5)
      .then((text) => setPreviewText(text || "无切块"))
      .catch(() => setPreviewText("加载失败"));
  };

  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunkCount, 0);

  return (
    <div className="library-page knowledge-page h-full overflow-y-auto">
      <div className="library-shell mx-auto max-w-6xl px-6 py-8 md:px-8 md:py-10">
        <div className="knowledge-illustrated-heading page-heading flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="app-title">知识库</h1>
            <p className="app-subtitle num mt-1.5">
              {documents.length} 份学习资料 · {totalChunks}{" "}
              个知识片段，为每一次提问提供依据
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={rebuild} disabled={rebuilding}>
              <RefreshCcw className="mr-1 h-4 w-4" />
              {rebuilding ? "重建中…" : "重建向量索引"}
            </Button>
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="mr-1 h-4 w-4" />
              上传 PDF
            </Button>
          </div>
        </div>

        <div className="knowledge-workbench">
          <section
            className="knowledge-search-panel space-y-3"
            aria-label="知识检索区"
          >
            <img
              src="/brand/knowledge-lines.webp"
              className="knowledge-search-art"
              alt=""
              loading="lazy"
            />
            <h2>把一个原理，理解透。</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              用自己的问题检索资料，再回到面试里练习表达。
            </p>
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="查找知识点，如：TCP 三次握手的过程"
                aria-label="知识检索"
                className="h-9 flex-1 rounded-md"
              />
              <Button onClick={runSearch} disabled={searching} className="h-9">
                {searching ? "检索中…" : "知识检索"}
              </Button>
            </div>
            {hits && (
              <div className="space-y-1.5">
                {hits.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    未命中知识块，或知识库检索未启用。
                  </p>
                )}
                {hits.map((hit) => (
                  <div
                    key={hit.chunkKey}
                    className="rounded-md bg-muted px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-medium text-foreground/80">
                        {hit.heading || "（无标题）"}
                      </p>
                      <span className="num shrink-0 text-xs font-medium text-primary">
                        {(hit.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {hit.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="knowledge-documents" aria-label="学习资料">
            <div className="library-section-heading">
              <h2>我的学习资料</h2>
              <span>{documents.length} 份文档</span>
            </div>
            <div className="knowledge-document-grid">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))
              ) : documents.length === 0 ? (
                <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
                  还没有知识文档，点击右上角“上传 PDF”导入八股文/面经资料。
                </Card>
              ) : (
                documents.map((doc) => (
                  <Card key={doc.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {doc.title}
                          </p>
                          {doc.category && (
                            <Badge
                              variant="outline"
                              className="shrink-0 font-normal text-muted-foreground"
                            >
                              {doc.category}
                            </Badge>
                          )}
                        </div>
                        <p
                          className="num truncate text-xs text-muted-foreground"
                          title={doc.sourceNote ?? ""}
                        >
                          {doc.pageCount ?? "—"} 页 · {doc.chunkCount} 块 ·{" "}
                          {doc.sourceNote || doc.fileName}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPreview(doc)}
                        >
                          切块预览
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeDocument(doc)}
                          aria-label="删除文档"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传知识 PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>PDF 文件（≤50MB，支持加密文件）</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>标题</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="默认取文件名"
                />
              </div>
              <div className="space-y-2">
                <Label>分类</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="如 计算机 / 面经"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>打开密码（无加密可留空）</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label>来源说明</Label>
              <Textarea
                value={sourceNote}
                onChange={(e) => setSourceNote(e.target.value)}
                rows={2}
                placeholder="注明资料来源与使用边界"
              />
            </div>
            {uploadError && (
              <p className="text-sm text-destructive">{uploadError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              取消
            </Button>
            <Button onClick={submitUpload} disabled={uploading}>
              {uploading ? "解析并向量化中…（大文件可能数分钟）" : "上传并处理"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={previewDoc !== null}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      >
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>切块预览 · {previewDoc?.title}</DialogTitle>
          </DialogHeader>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/80">
            {previewText}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
