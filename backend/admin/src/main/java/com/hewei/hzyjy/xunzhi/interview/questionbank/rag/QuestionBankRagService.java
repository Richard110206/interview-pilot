package com.hewei.hzyjy.xunzhi.interview.questionbank.rag;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.hewei.hzyjy.xunzhi.interview.questionbank.dao.entity.QuestionBankDO;
import com.hewei.hzyjy.xunzhi.interview.questionbank.dao.mapper.QuestionBankMapper;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingStore;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

/**
 * 题库向量检索服务：题目向量化入库（千问 embedding）与语义检索（Redis Stack 向量索引）。
 * 任何向量链路故障只记录日志并降级为空结果，不阻断题库 CRUD 与出题主流程。
 */
@Service
@Slf4j
public class QuestionBankRagService {

    private final QuestionBankRagProperties properties;
    private final QuestionBankMapper questionBankMapper;
    private final ObjectProvider<EmbeddingModel> embeddingModelProvider;
    private final ObjectProvider<EmbeddingStore<TextSegment>> embeddingStoreProvider;

    public QuestionBankRagService(QuestionBankRagProperties properties,
                                  QuestionBankMapper questionBankMapper,
                                  ObjectProvider<EmbeddingModel> embeddingModelProvider,
                                  @org.springframework.beans.factory.annotation.Qualifier("questionBankEmbeddingStore")
                                  ObjectProvider<EmbeddingStore<TextSegment>> embeddingStoreProvider) {
        this.properties = properties;
        this.questionBankMapper = questionBankMapper;
        this.embeddingModelProvider = embeddingModelProvider;
        this.embeddingStoreProvider = embeddingStoreProvider;
    }

    /**
     * 检索命中：id 为题库主键，score 为 0-1 余弦相似度。
     */
    public record QuestionBankHit(Long id, double score, String category, String skillTag,
                                  Integer difficulty, String questionText) {
    }

    public boolean isEnabled() {
        return properties.isEnabled() && embeddingModelProvider.getIfAvailable() != null
                && embeddingStoreProvider.getIfAvailable() != null;
    }

    /**
     * 题目新增或修改后同步向量索引；禁用或删除题目时仅移除旧向量。
     */
    public void indexQuestion(QuestionBankDO question) {
        if (!isEnabled() || question == null || question.getId() == null) {
            return;
        }
        try {
            EmbeddingStore<TextSegment> store = embeddingStoreProvider.getObject();
            if (question.getStatus() == null || question.getStatus() != 1
                    || StrUtil.isBlank(question.getQuestionText())) {
                store.remove(question.getId().toString());
                return;
            }
            store.addAll(List.of(question.getId().toString()),
                    List.of(embeddingModelProvider.getObject().embed(embeddingText(question)).content()),
                    List.of(TextSegment.from(embeddingText(question), questionMetadata(question))));
        } catch (Exception e) {
            log.warn("题库向量索引同步失败，降级跳过，questionId={}, error={}", question.getId(), e.getMessage());
        }
    }

    public void removeQuestion(Long questionId) {
        if (!isEnabled() || questionId == null) {
            return;
        }
        try {
            embeddingStoreProvider.getObject().remove(questionId.toString());
        } catch (Exception e) {
            log.warn("题库向量移除失败，降级跳过，questionId={}, error={}", questionId, e.getMessage());
        }
    }

    /**
     * 语义检索与给定文本（如简历全文）最相关的启用中的真题。失败或未启用时返回空列表。
     */
    public List<QuestionBankHit> searchRelated(String text, int topK) {
        if (!isEnabled() || StrUtil.isBlank(text)) {
            return List.of();
        }
        try {
            int limit = Math.max(1, Math.min(topK <= 0 ? properties.getTopK() : topK, 20));
            List<EmbeddingMatch<TextSegment>> matches = embeddingStoreProvider.getObject()
                    .search(EmbeddingSearchRequest.builder()
                            .queryEmbedding(embeddingModelProvider.getObject().embed(text).content())
                            .maxResults(limit)
                            .minScore(properties.getMinScore())
                            .build())
                    .matches();
            return matches.stream()
                    .map(match -> {
                        TextSegment segment = match.embedded();
                        return new QuestionBankHit(
                                Long.valueOf(segment.metadata().getString("questionBankId")),
                                match.score(),
                                segment.metadata().getString("category"),
                                segment.metadata().getString("skillTag"),
                                Integer.valueOf(segment.metadata().getString("difficulty")),
                                segment.text());
                    })
                    .toList();
        } catch (Exception e) {
            log.warn("题库向量检索失败，出题降级为纯模型生成，error={}", e.getMessage());
            return List.of();
        }
    }

    /**
     * 全量重建向量索引：清空后重新灌入全部启用题目，返回索引条数。
     */
    public int rebuildIndex() {
        if (!isEnabled()) {
            return 0;
        }
        try {
            List<QuestionBankDO> questions = questionBankMapper.selectList(
                    Wrappers.<QuestionBankDO>lambdaQuery()
                            .eq(QuestionBankDO::getStatus, 1)
                            .eq(QuestionBankDO::getDelFlag, 0));
            EmbeddingStore<TextSegment> store = embeddingStoreProvider.getObject();
            EmbeddingModel model = embeddingModelProvider.getObject();
            store.removeAll();
            int indexed = 0;
            for (QuestionBankDO question : questions) {
                if (StrUtil.isBlank(question.getQuestionText())) {
                    continue;
                }
                store.addAll(List.of(question.getId().toString()), List.of(model.embed(embeddingText(question)).content()),
                        List.of(TextSegment.from(embeddingText(question), questionMetadata(question))));
                indexed++;
            }
            log.info("题库向量索引重建完成，indexed={}", indexed);
            return indexed;
        } catch (Exception e) {
            throw new IllegalStateException("题库向量索引重建失败：" + e.getMessage(), e);
        }
    }

    private String embeddingText(QuestionBankDO question) {
        return StrUtil.nullToEmpty(question.getCategory()) + " "
                + StrUtil.nullToEmpty(question.getSkillTag()) + " "
                + StrUtil.nullToEmpty(question.getQuestionText());
    }

    private dev.langchain4j.data.document.Metadata questionMetadata(QuestionBankDO question) {
        // "id" 元数据被 RedisEmbeddingStore 用作文档键，保证同一题目可覆盖更新与删除。
        return dev.langchain4j.data.document.Metadata.from(java.util.Map.of(
                "id", question.getId().toString(),
                "questionBankId", question.getId().toString(),
                "category", StrUtil.nullToEmpty(question.getCategory()),
                "skillTag", StrUtil.nullToEmpty(question.getSkillTag()),
                "difficulty", String.valueOf(question.getDifficulty() == null ? 3 : question.getDifficulty())));
    }
}
