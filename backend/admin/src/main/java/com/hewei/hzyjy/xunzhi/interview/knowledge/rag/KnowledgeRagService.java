package com.hewei.hzyjy.xunzhi.interview.knowledge.rag;

import cn.hutool.core.util.StrUtil;
import com.hewei.hzyjy.xunzhi.interview.knowledge.dao.entity.KnowledgeChunkDO;
import com.hewei.hzyjy.xunzhi.interview.knowledge.dao.entity.KnowledgeDocumentDO;
import com.hewei.hzyjy.xunzhi.interview.knowledge.dao.mapper.KnowledgeChunkMapper;
import com.hewei.hzyjy.xunzhi.interview.knowledge.dao.mapper.KnowledgeDocumentMapper;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingStore;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

/**
 * 知识库向量服务：切块向量化（独立索引）、按文档删除、语义检索。
 * 向量链路故障降级为空结果，不阻断文档入库与出题主流程。
 */
@Service
@Slf4j
public class KnowledgeRagService {

    /** 检索命中：chunkKey 为块主键，content 为知识块文本。 */
    public record KnowledgeHit(String chunkKey, Long documentId, String heading, double score, String content) {
    }

    private static final int EMBED_BATCH = 16;

    private final KnowledgeRagProperties properties;
    private final KnowledgeDocumentMapper documentMapper;
    private final KnowledgeChunkMapper chunkMapper;
    private final ObjectProvider<EmbeddingModel> embeddingModelProvider;
    private final ObjectProvider<EmbeddingStore<TextSegment>> embeddingStoreProvider;

    public KnowledgeRagService(KnowledgeRagProperties properties,
                               KnowledgeDocumentMapper documentMapper,
                               KnowledgeChunkMapper chunkMapper,
                               ObjectProvider<EmbeddingModel> embeddingModelProvider,
                               @Qualifier("knowledgeEmbeddingStore")
                               ObjectProvider<EmbeddingStore<TextSegment>> embeddingStoreProvider) {
        this.properties = properties;
        this.documentMapper = documentMapper;
        this.chunkMapper = chunkMapper;
        this.embeddingModelProvider = embeddingModelProvider;
        this.embeddingStoreProvider = embeddingStoreProvider;
    }

    public boolean isEnabled() {
        return properties.isEnabled() && embeddingModelProvider.getIfAvailable() != null
                && embeddingStoreProvider.getIfAvailable() != null;
    }

    /**
     * 文档切块入库后批量向量化。失败仅告警，块数据仍在 MySQL，可重建索引恢复。
     */
    public void indexDocument(KnowledgeDocumentDO document, List<KnowledgeChunkDO> chunks) {
        if (!isEnabled() || document == null || chunks == null || chunks.isEmpty()) {
            return;
        }
        try {
            EmbeddingStore<TextSegment> store = embeddingStoreProvider.getObject();
            EmbeddingModel model = embeddingModelProvider.getObject();
            for (int from = 0; from < chunks.size(); from += EMBED_BATCH) {
                List<KnowledgeChunkDO> batch = chunks.subList(from, Math.min(from + EMBED_BATCH, chunks.size()));
                List<TextSegment> segments = new ArrayList<>(batch.size());
                for (KnowledgeChunkDO chunk : batch) {
                    segments.add(TextSegment.from(embeddingText(document, chunk), metadata(chunk)));
                }
                store.addAll(model.embedAll(segments).content(), segments);
            }
            log.info("知识文档向量索引完成, documentId={}, chunks={}", document.getId(), chunks.size());
        } catch (Exception e) {
            log.warn("知识文档向量化失败，可稍后重建索引, documentId={}, error={}", document.getId(), e.getMessage());
        }
    }

    public void removeDocument(Long documentId) {
        if (!isEnabled() || documentId == null) {
            return;
        }
        try {
            EmbeddingStore<TextSegment> store = embeddingStoreProvider.getObject();
            chunkMapper.selectList(com.baomidou.mybatisplus.core.toolkit.Wrappers.<KnowledgeChunkDO>lambdaQuery().eq(KnowledgeChunkDO::getDocumentId, documentId))
                    .forEach(chunk -> store.remove(chunk.getId().toString()));
        } catch (Exception e) {
            log.warn("知识文档向量删除失败, documentId={}, error={}", documentId, e.getMessage());
        }
    }

    /**
     * 语义检索知识块。未启用或失败时返回空列表。
     */
    public List<KnowledgeHit> searchKnowledge(String query, int topK) {
        if (!isEnabled() || StrUtil.isBlank(query)) {
            return List.of();
        }
        try {
            int limit = Math.max(1, Math.min(topK <= 0 ? properties.getTopK() : topK, 10));
            List<EmbeddingMatch<TextSegment>> matches = embeddingStoreProvider.getObject()
                    .search(EmbeddingSearchRequest.builder()
                            .queryEmbedding(embeddingModelProvider.getObject().embed(query).content())
                            .maxResults(limit)
                            .minScore(properties.getMinScore())
                            .build())
                    .matches();
            return matches.stream()
                    .map(match -> new KnowledgeHit(
                            match.embedded().metadata().getString("chunkKey"),
                            Long.valueOf(match.embedded().metadata().getString("documentId")),
                            StrUtil.nullToEmpty(match.embedded().metadata().getString("heading")),
                            match.score(),
                            match.embedded().text()))
                    .toList();
        } catch (Exception e) {
            log.warn("知识库向量检索失败，降级为空结果, error={}", e.getMessage());
            return List.of();
        }
    }

    /**
     * 全量重建：清空知识索引后按启用文档重灌。返回索引块数。
     */
    public int rebuildAll() {
        if (!isEnabled()) {
            return 0;
        }
        List<KnowledgeDocumentDO> documents = documentMapper.selectList(
                com.baomidou.mybatisplus.core.toolkit.Wrappers.<KnowledgeDocumentDO>lambdaQuery().eq(KnowledgeDocumentDO::getStatus, 1)
                        .eq(KnowledgeDocumentDO::getDelFlag, 0));
        int indexed = 0;
        try {
            embeddingStoreProvider.getObject().removeAll();
        } catch (Exception e) {
            log.warn("清空知识索引失败: {}", e.getMessage());
        }
        for (KnowledgeDocumentDO document : documents) {
            List<KnowledgeChunkDO> chunks = chunkMapper.selectList(
                    com.baomidou.mybatisplus.core.toolkit.Wrappers.<KnowledgeChunkDO>lambdaQuery().eq(KnowledgeChunkDO::getDocumentId, document.getId()));
            indexDocument(document, chunks);
            indexed += chunks.size();
        }
        return indexed;
    }

    private String embeddingText(KnowledgeDocumentDO document, KnowledgeChunkDO chunk) {
        String heading = StrUtil.nullToEmpty(chunk.getHeading());
        return StrUtil.nullToEmpty(document.getCategory()) + " " + heading + "\n" + StrUtil.nullToEmpty(chunk.getContent());
    }

    private dev.langchain4j.data.document.Metadata metadata(KnowledgeChunkDO chunk) {
        // "id" 元数据作为 Redis 文档键，支持按块删除与覆盖
        return dev.langchain4j.data.document.Metadata.from(java.util.Map.of(
                "id", chunk.getId().toString(),
                "chunkKey", chunk.getId().toString(),
                "documentId", chunk.getDocumentId().toString(),
                "heading", StrUtil.nullToEmpty(chunk.getHeading())));
    }
}
