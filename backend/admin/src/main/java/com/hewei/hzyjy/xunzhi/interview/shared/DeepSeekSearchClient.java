package com.hewei.hzyjy.xunzhi.interview.shared;

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.hewei.hzyjy.xunzhi.ai.dao.entity.AiPropertiesDO;
import com.hewei.hzyjy.xunzhi.ai.service.AiPropertiesService;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * DeepSeek 官方 Search API 客户端（自研搜索，按次计费）。
 * 复用模型配置表中已启用的 deepseek 密钥；供题库扩充与后续岗位情报智能体共用。
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DeepSeekSearchClient {

    /** 单条搜索结果的精简结构，summary 为 600-800 字符长摘要。 */
    public record SearchResult(String title, String url, String snippet, String summary, String date) {
    }

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10)).build();

    private final AiPropertiesService models;

    /**
     * 网页搜索。query 长度 1-128 字符；count 1-50。
     * 失败时抛出 IllegalStateException，由调用方决定降级策略。
     */
    public List<SearchResult> search(String query, int count) {
        if (StrUtil.isBlank(query) || query.length() > 128) {
            throw new IllegalArgumentException("搜索词长度需在 1-128 字符");
        }
        try {
            AiPropertiesDO model = requireModel();
            String base = StrUtil.blankToDefault(model.getApiUrl(), "https://api.deepseek.com").replaceAll("/+$", "");
            JSONObject payload = new JSONObject();
            payload.put("query", query);
            payload.put("count", Math.max(1, Math.min(count, 50)));
            HttpRequest request = HttpRequest.newBuilder(URI.create(base + "/v1/tools/search"))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + model.getApiKey())
                    .POST(HttpRequest.BodyPublishers.ofString(payload.toJSONString(), StandardCharsets.UTF_8)).build();
            HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() != 200) {
                // 不回传供应商响应正文，避免泄漏请求内容
                throw new IllegalStateException("DeepSeek 搜索失败（HTTP " + response.statusCode() + "）");
            }
            JSONObject root = JSON.parseObject(response.body());
            JSONArray results = root == null ? null : root.getJSONArray("results");
            List<SearchResult> hits = new ArrayList<>();
            if (results != null) {
                for (int i = 0; i < results.size(); i++) {
                    JSONObject item = results.getJSONObject(i);
                    hits.add(new SearchResult(
                            StrUtil.nullToEmpty(item.getString("title")),
                            StrUtil.nullToEmpty(item.getString("url")),
                            StrUtil.nullToEmpty(item.getString("snippet")),
                            StrUtil.nullToEmpty(item.getString("summary")),
                            StrUtil.nullToEmpty(item.getString("date"))));
                }
            }
            log.info("DeepSeek search completed, query length={}, results={}", query.length(), hits.size());
            return hits;
        } catch (IllegalStateException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("DeepSeek 搜索请求失败：" + e.getMessage(), e);
        }
    }

    /** 供题目生成等下游复用同一份模型配置（含 chat 调用的 key 与 base url）。 */
    public AiPropertiesDO requireModel() {
        AiPropertiesDO model = models.getEnabledByAiType("deepseek");
        if (model == null || StrUtil.isBlank(model.getApiKey())) {
            throw new IllegalStateException("需要一个已启用且配置密钥的 DeepSeek 模型");
        }
        return model;
    }
}
