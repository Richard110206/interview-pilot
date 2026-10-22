package com.hewei.hzyjy.xunzhi.interview.questionbank.rag;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 题库 RAG 配置。默认关闭，避免未配置 DashScope 密钥或 Redis Stack 的环境启动失败。
 */
@Data
@Component
@ConfigurationProperties(prefix = "xunzhi-agent.question-bank.rag")
public class QuestionBankRagProperties {

    /**
     * 是否启用题库向量检索。需要 DASHSCOPE_API_KEY 与支持 RediSearch 的 Redis（Redis Stack）。
     */
    private boolean enabled = false;

    /**
     * 千问 embedding 模型名
     */
    private String embeddingModel = "text-embedding-v3";

    /**
     * 向量维度，需与 embedding 模型输出一致
     */
    private int embeddingDimension = 1024;

    /**
     * Redis 向量索引名
     */
    private String indexName = "question_bank_idx";

    /**
     * 出题时检索的候选题数量
     */
    private int topK = 8;

    /**
     * 相似度下限 0-1，低于该分数的候选不注入出题提示
     */
    private double minScore = 0.3;
}
