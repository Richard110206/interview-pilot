package com.hewei.hzyjy.xunzhi.interview.knowledge.api;

import com.hewei.hzyjy.xunzhi.common.convention.annotation.CurrentUser;
import com.hewei.hzyjy.xunzhi.common.convention.context.UserContext;
import com.hewei.hzyjy.xunzhi.common.convention.result.Result;
import com.hewei.hzyjy.xunzhi.common.convention.result.Results;
import com.hewei.hzyjy.xunzhi.interview.knowledge.dao.entity.KnowledgeDocumentDO;
import com.hewei.hzyjy.xunzhi.interview.knowledge.rag.KnowledgeRagService.KnowledgeHit;
import com.hewei.hzyjy.xunzhi.interview.knowledge.service.KnowledgeDocumentService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 知识库接口：PDF 上传入库、文档管理、语义检索与索引运维。
 */
@RestController
@RequestMapping("/api/xunzhi/v1/interview/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final KnowledgeDocumentService knowledgeDocumentService;

    /**
     * 上传 PDF：提取文本→结构化切分→MySQL 落库→向量索引。加密 PDF 可携带密码。
     */
    @PostMapping("/documents")
    public Result<KnowledgeDocumentService.UploadResult> uploadPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "sourceNote", required = false) String sourceNote,
            @CurrentUser UserContext currentUser) {
        return Results.success(knowledgeDocumentService.uploadPdf(file, title, category, password, sourceNote));
    }

    @GetMapping("/documents")
    public Result<List<KnowledgeDocumentDO>> listDocuments(@CurrentUser UserContext currentUser) {
        return Results.success(knowledgeDocumentService.listDocuments());
    }

    @PostMapping("/documents/{id}/delete")
    public Result<Void> deleteDocument(
            @PathVariable Long id, @CurrentUser UserContext currentUser) {
        knowledgeDocumentService.deleteDocument(id);
        return Results.success();
    }

    @GetMapping("/search")
    public Result<List<KnowledgeHit>> search(
            @RequestParam String query,
            @RequestParam(required = false) Integer topK,
            @CurrentUser UserContext currentUser) {
        return Results.success(knowledgeDocumentService.search(query, topK));
    }

    @PostMapping("/rebuild-index")
    public Result<Integer> rebuildIndex(@CurrentUser UserContext currentUser) {
        return Results.success(knowledgeDocumentService.rebuildIndex());
    }

    @GetMapping("/documents/{id}/chunks")
    public Result<String> chunksPreview(
            @PathVariable Long id,
            @RequestParam(defaultValue = "5") int limit,
            @CurrentUser UserContext currentUser) {
        return Results.success(knowledgeDocumentService.chunksPreview(id, limit));
    }
}
