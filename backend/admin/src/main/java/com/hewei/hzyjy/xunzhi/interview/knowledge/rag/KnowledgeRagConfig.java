package com.hewei.hzyjy.xunzhi.interview.knowledge.rag;

import dev.langchain4j.community.store.embedding.redis.RedisEmbeddingStore;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.store.embedding.EmbeddingStore;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

/**
 * 知识库向量存储：独立于题库索引，共用同一 Redis 实例与 embedding 模型。
 */
@Configuration
@ConditionalOnProperty(prefix = "xunzhi-agent.knowledge.rag", name = "enabled", havingValue = "true")
public class KnowledgeRagConfig {

    @Bean
    @Qualifier("knowledgeEmbeddingStore")
    public EmbeddingStore<TextSegment> knowledgeEmbeddingStore(
            KnowledgeRagProperties properties, Environment environment) {
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
                // 文档键前缀必须独立，否则与题库索引互相扫到对方文档
                .prefix(properties.getIndexName() + ":")
                .dimension(properties.getEmbeddingDimension())
                .metadataKeys(List.of("chunkKey", "documentId", "heading"))
                .build();
    }
}
