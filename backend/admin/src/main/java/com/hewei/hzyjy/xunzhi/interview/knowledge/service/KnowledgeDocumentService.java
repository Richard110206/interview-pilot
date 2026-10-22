package com.hewei.hzyjy.xunzhi.interview.knowledge.service;

import cn.hutool.core.util.StrUtil;
import com.hewei.hzyjy.xunzhi.common.convention.exception.ClientException;
import com.hewei.hzyjy.xunzhi.interview.knowledge.dao.entity.KnowledgeChunkDO;
import com.hewei.hzyjy.xunzhi.interview.knowledge.dao.entity.KnowledgeDocumentDO;
import com.hewei.hzyjy.xunzhi.interview.knowledge.dao.mapper.KnowledgeChunkMapper;
import com.hewei.hzyjy.xunzhi.interview.knowledge.dao.mapper.KnowledgeDocumentMapper;
import com.hewei.hzyjy.xunzhi.interview.knowledge.rag.KnowledgeRagProperties;
import com.hewei.hzyjy.xunzhi.interview.knowledge.rag.KnowledgeRagService;
import com.hewei.hzyjy.xunzhi.interview.knowledge.rag.KnowledgeRagService.KnowledgeHit;
import com.hewei.hzyjy.xunzhi.interview.knowledge.rag.PdfKnowledgeSplitter;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 知识库文档服务：PDF 上传 → 提取切分 → MySQL 落库 → 向量索引，及文档管理与检索。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KnowledgeDocumentService {

    private final KnowledgeDocumentMapper documentMapper;
    private final KnowledgeChunkMapper chunkMapper;
    private final KnowledgeRagProperties properties;
    private final PdfKnowledgeSplitter splitter;
    private final KnowledgeRagService knowledgeRagService;

    /** 上传处理结果：文档ID、页数、切块数与向量索引状态。 */
    public record UploadResult(Long documentId, int pages, int chunks, boolean vectorIndexed) {
    }

    public UploadResult uploadPdf(MultipartFile file, String title, String category,
                                  String password, String sourceNote) {
        if (file == null || file.isEmpty()) {
            throw new ClientException("请上传 PDF 文件");
        }
        if (file.getSize() > properties.getMaxFileSizeMb() * 1024L * 1024L) {
            throw new ClientException("文件超过大小限制：" + properties.getMaxFileSizeMb() + "MB");
        }
        String fileName = StrUtil.blankToDefault(file.getOriginalFilename(), "knowledge.pdf");
        if (!fileName.toLowerCase().endsWith(".pdf")) {
            throw new ClientException("仅支持 PDF 文件");
        }
        byte[] bytes;
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            file.getInputStream().transferTo(out);
            bytes = out.toByteArray();
        } catch (Exception e) {
            throw new ClientException("读取上传文件失败");
        }
        PdfKnowledgeSplitter.SplitResult splitResult = splitter.split(
                bytes, password, properties.getMaxPages(), properties.getChunkSize(), properties.getChunkOverlap());
        List<PdfKnowledgeSplitter.Chunk> chunks = splitResult.chunks();
        if (chunks.isEmpty()) {
            throw new ClientException("未从 PDF 提取到可用文本（扫描件暂不支持）");
        }

        KnowledgeDocumentDO document = new KnowledgeDocumentDO();
        document.setTitle(StrUtil.blankToDefault(title, fileName));
        document.setFileName(fileName);
        document.setCategory(StrUtil.nullToEmpty(category));
        document.setPageCount(splitResult.pages());
        document.setChunkCount(chunks.size());
        document.setStatus(1);
        document.setSourceNote(StrUtil.nullToEmpty(sourceNote));
        document.setDelFlag(0);
        documentMapper.insert(document);

        List<KnowledgeChunkDO> chunkEntities = new java.util.ArrayList<>(chunks.size());
        for (int i = 0; i < chunks.size(); i++) {
            PdfKnowledgeSplitter.Chunk chunk = chunks.get(i);
            KnowledgeChunkDO entity = new KnowledgeChunkDO();
            entity.setDocumentId(document.getId());
            entity.setChunkSeq(i + 1);
            entity.setPageStart(chunk.pageStart());
            entity.setPageEnd(chunk.pageEnd());
            entity.setHeading(StrUtil.maxLength(chunk.heading(), 500));
            entity.setContent(chunk.content());
            entity.setDelFlag(0);
            chunkEntities.add(entity);
        }
        chunkEntities.forEach(chunkMapper::insert);

        knowledgeRagService.indexDocument(document, chunkEntities);
        log.info("知识文档入库完成, id={}, file={}, pages={}, chunks={}",
                document.getId(), fileName, splitResult.pages(), chunks.size());
        return new UploadResult(document.getId(), splitResult.pages(), chunks.size(),
                knowledgeRagService.isEnabled());
    }

    public List<KnowledgeDocumentDO> listDocuments() {
        return documentMapper.selectList(
                com.baomidou.mybatisplus.core.toolkit.Wrappers.<KnowledgeDocumentDO>lambdaQuery().eq(KnowledgeDocumentDO::getDelFlag, 0)
                        .orderByDesc(KnowledgeDocumentDO::getUpdateTime));
    }

    public void deleteDocument(Long id) {
        KnowledgeDocumentDO document = documentMapper.selectById(id);
        if (document == null || document.getDelFlag() != 0) {
            throw new ClientException("文档不存在或已删除");
        }
        KnowledgeDocumentDO update = new KnowledgeDocumentDO();
        update.setId(id);
        update.setDelFlag(1);
        documentMapper.updateById(update);
        chunkMapper.selectList(com.baomidou.mybatisplus.core.toolkit.Wrappers.<KnowledgeChunkDO>lambdaQuery().eq(KnowledgeChunkDO::getDocumentId, id))
                .forEach(chunk -> {
                    KnowledgeChunkDO chunkUpdate = new KnowledgeChunkDO();
                    chunkUpdate.setId(chunk.getId());
                    chunkUpdate.setDelFlag(1);
                    chunkMapper.updateById(chunkUpdate);
                });
        knowledgeRagService.removeDocument(id);
    }

    public List<KnowledgeHit> search(String query, Integer topK) {
        if (StrUtil.isBlank(query)) {
            throw new ClientException("检索关键词不能为空");
        }
        return knowledgeRagService.searchKnowledge(query, topK == null ? 0 : topK);
    }

    public int rebuildIndex() {
        return knowledgeRagService.rebuildAll();
    }

    public String chunksPreview(Long documentId, int limit) {
        return chunkMapper.selectList(com.baomidou.mybatisplus.core.toolkit.Wrappers.<KnowledgeChunkDO>lambdaQuery().eq(KnowledgeChunkDO::getDocumentId, documentId)
                        .eq(KnowledgeChunkDO::getDelFlag, 0)
                        .orderByAsc(KnowledgeChunkDO::getChunkSeq)
                        .last("limit " + Math.max(1, Math.min(limit, 20))))
                .stream()
                .map(chunk -> String.format("[#%d %s] %s", chunk.getChunkSeq(),
                        StrUtil.nullToEmpty(chunk.getHeading()), StrUtil.maxLength(chunk.getContent(), 120)))
                .collect(Collectors.joining("\n"));
    }
}
