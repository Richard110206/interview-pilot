package com.hewei.hzyjy.xunzhi.interview.knowledge.rag;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 知识库 RAG 配置：PDF 提取切分与向量检索参数。默认关闭。
 */
@Data
@Component
@ConfigurationProperties(prefix = "xunzhi-agent.knowledge.rag")
public class KnowledgeRagProperties {

    /**
     * 是否启用知识库向量检索。需要 DASHSCOPE_API_KEY 与 Redis Stack。
     */
    private boolean enabled = false;

    /**
     * Redis 向量索引名（与题库索引相互独立）
     */
    private String indexName = "knowledge_doc_idx";

    /**
     * 向量维度，与题库共用同一个 embedding 模型时保持一致
     */
    private int embeddingDimension = 1024;

    /**
     * 切块目标长度（字符）
     */
    private int chunkSize = 800;

    /**
     * 超长块滑窗切分的重叠字符数
     */
    private int chunkOverlap = 100;

    /**
     * 单个文档最大页数限制
     */
    private int maxPages = 600;

    /**
     * 上传 PDF 最大大小（MB）
     */
    private int maxFileSizeMb = 50;

    /**
     * 检索返回块数
     */
    private int topK = 5;

    /**
     * 相似度下限
     */
    private double minScore = 0.3;
}
