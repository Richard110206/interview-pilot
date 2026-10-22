package com.hewei.hzyjy.xunzhi.interview.questionbank.rag;

import dev.langchain4j.community.model.dashscope.QwenEmbeddingModel;
import dev.langchain4j.community.store.embedding.redis.RedisEmbeddingStore;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.util.List;

/**
 * 题库 RAG 基础设施：千问 embedding + Redis 向量存储。
 * 仅在 xunzhi-agent.question-bank.rag.enabled=true 时装配，其余环境保持零依赖启动。
 */
@Configuration
@ConditionalOnProperty(prefix = "xunzhi-agent.question-bank.rag", name = "enabled", havingValue = "true")
public class QuestionBankRagConfig {

    @Bean
    public EmbeddingModel questionBankEmbeddingModel(QuestionBankRagProperties properties, Environment environment) {
        String apiKey = environment.getProperty("DASHSCOPE_API_KEY", environment.getProperty("dashscope.api-key", ""));
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("题库 RAG 已启用但未配置 DASHSCOPE_API_KEY");
        }
        return QwenEmbeddingModel.builder()
                .apiKey(apiKey)
                .modelName(properties.getEmbeddingModel())
                .build();
    }

    @Bean
    @org.springframework.beans.factory.annotation.Qualifier("questionBankEmbeddingStore")
    public EmbeddingStore<TextSegment> questionBankEmbeddingStore(
            QuestionBankRagProperties properties, Environment environment) {
        // 复用 Spring Data Redis 的主机/端口配置，保证与业务 Redis 指向一致。
        String host = environment.getProperty("spring.data.redis.host", "127.0.0.1");
        int port = environment.getProperty("spring.data.redis.port", Integer.class, 6379);
        String password = environment.getProperty("spring.data.redis.password", "");
        redis.clients.jedis.JedisClientConfig config = redis.clients.jedis.DefaultJedisClientConfig.builder()
                .password(password == null || password.isBlank() ? null : password)
                .build();
        redis.clients.jedis.UnifiedJedis jedis = new redis.clients.jedis.JedisPooled(
                new redis.clients.jedis.HostAndPort(host, port), config);
        return RedisEmbeddingStore.builder()
                .unifiedJedis(jedis)
                .indexName(properties.getIndexName())
                // 文档键前缀必须独立，否则多个索引共用默认前缀会互相扫到对方文档
                .prefix(properties.getIndexName() + ":")
                .dimension(properties.getEmbeddingDimension())
                // 检索回读时仅解析已声明的元数据字段，未声明会导致回读 null 而解析失败
                .metadataKeys(List.of("questionBankId", "category", "skillTag", "difficulty"))
                .build();
    }
}
