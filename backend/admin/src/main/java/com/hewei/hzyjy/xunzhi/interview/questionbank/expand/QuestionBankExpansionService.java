package com.hewei.hzyjy.xunzhi.interview.questionbank.expand;

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.hewei.hzyjy.xunzhi.ai.dao.entity.AiPropertiesDO;
import com.hewei.hzyjy.xunzhi.interview.questionbank.dao.entity.QuestionBankDO;
import com.hewei.hzyjy.xunzhi.interview.questionbank.dao.mapper.QuestionBankMapper;
import com.hewei.hzyjy.xunzhi.interview.questionbank.rag.QuestionBankRagService;
import com.hewei.hzyjy.xunzhi.interview.shared.DeepSeekSearchClient;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 题库联网扩充管道：DeepSeek Search 检索真实面经/招聘材料 →
 * DeepSeek Chat 基于材料编写结构化题目 → 与现有题库查重 → 入库并自动向量化。
 * 生成的题目 source 标记为“联网采集·模型编写”，不冒充人工录入真题。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionBankExpansionService {

    private static final Set<String> QUESTION_TYPES = Set.of("CONCEPT", "SCENARIO", "CODING", "PROJECT");
    private static final String EXPAND_SOURCE = "联网采集·模型编写";
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10)).build();

    private final DeepSeekSearchClient searchClient;
    private final QuestionBankMapper questionBankMapper;
    private final QuestionBankRagService questionBankRagService;

    /** 扩充结果：新增条数、跳过的重复/非法条数与失败原因。 */
    public record ExpansionResult(int searched, int generated, int inserted, int skippedDuplicate,
                                  int skippedInvalid, String note) {
    }

    public ExpansionResult expand(QuestionBankExpandReqDTO reqDTO) {
        String category = reqDTO.getCategory().trim();
        String skillTag = reqDTO.getSkillTag().trim();
        int count = Math.max(1, Math.min(reqDTO.getCount() == null ? 5 : reqDTO.getCount(), 10));

        // 1. 联网检索真实材料：面经与招聘要求为主
        List<DeepSeekSearchClient.SearchResult> results;
        try {
            results = searchClient.search(category + " " + skillTag + " 面试题 高频 考点", 6);
        } catch (Exception e) {
            return new ExpansionResult(0, 0, 0, 0, 0, "联网检索失败，未生成：" + e.getMessage());
        }
        String material = buildMaterial(results);
        if (StrUtil.isBlank(material)) {
            return new ExpansionResult(results.size(), 0, 0, 0, 0, "检索无有效内容，未生成");
        }

        // 2. 模型基于材料编写结构化题目
        String raw;
        try {
            raw = generateQuestions(category, skillTag, count, material);
        } catch (Exception e) {
            return new ExpansionResult(results.size(), 0, 0, 0, 0, "题目生成失败：" + e.getMessage());
        }

        // 3. 解析、查重、入库并向量化
        Set<String> existing = existingQuestionKeys();
        int inserted = 0, duplicate = 0, invalid = 0;
        for (JSONObject item : parseQuestions(raw)) {
            if (StrUtil.isBlank(item.getString("questionText"))) {
                invalid++;
                continue;
            }
            QuestionBankDO question = toQuestion(category, skillTag, item);
            if (question == null) {
                invalid++;
                continue;
            }
            if (!existing.add(normalizeKey(question.getQuestionText()))) {
                duplicate++;
                continue;
            }
            questionBankMapper.insert(question);
            questionBankRagService.indexQuestion(question);
            inserted++;
        }
        log.info("Question bank expansion done, category={}, skillTag={}, searched={}, generated={}, inserted={}, duplicate={}, invalid={}",
                category, skillTag, results.size(), inserted + duplicate + invalid, inserted, duplicate, invalid);
        return new ExpansionResult(results.size(), inserted + duplicate + invalid,
                inserted, duplicate, invalid, "完成");
    }

    private String buildMaterial(List<DeepSeekSearchClient.SearchResult> results) {
        StringBuilder sb = new StringBuilder();
        for (DeepSeekSearchClient.SearchResult result : results) {
            if (StrUtil.isBlank(result.summary()) && StrUtil.isBlank(result.snippet())) {
                continue;
            }
            String body = StrUtil.blankToDefault(result.summary(), result.snippet());
            if (body.length() > 700) {
                body = body.substring(0, 700);
            }
            sb.append("【").append(StrUtil.nullToEmpty(result.title())).append("】")
                    .append(body).append('\n');
        }
        return sb.length() > 4000 ? sb.substring(0, 4000) : sb.toString();
    }

    private String generateQuestions(String category, String skillTag, int count, String material)
            throws Exception {
        AiPropertiesDO model = searchClient.requireModel();
        String base = StrUtil.blankToDefault(model.getApiUrl(), "https://api.deepseek.com").replaceAll("/+$", "");
        String system = "你是多岗位技术面试题库编审，严格围绕用户指定的岗位方向与技能标签出题，不要将其他岗位强行改写成Java问题。基于给定的真实网络检索材料编写面试题，不得逐字照抄材料原句。"
                + "只返回JSON对象，不使用Markdown。返回格式："
                + "{\"questions\":[{\"questionText\":\"题干\",\"questionType\":\"CONCEPT或SCENARIO或CODING或PROJECT\","
                + "\"difficulty\":3,\"referenceAnswer\":\"150-300字参考答案\",\"scoringPoints\":[\"评分要点\"]}]}。"
                + "questions 必须恰好 " + count + " 项；difficulty 为 1-5 整数；每题只考一个核心考点；"
                + "scoringPoints 为 4-6 条；题干为中文且不超过 300 字；参考答案依据材料与公认技术事实，不编造。";
        String user = "方向：" + category + "；技能标签：" + skillTag
                + "。以下是网络检索到的真实材料（含招聘要求与面经片段）：\n<material>\n" + material + "\n</material>";
        JSONObject payload = new JSONObject();
        payload.put("model", model.getModelName());
        payload.put("messages", List.of(
                java.util.Map.of("role", "system", "content", system),
                java.util.Map.of("role", "user", "content", user)));
        payload.put("response_format", java.util.Map.of("type", "json_object"));
        payload.put("max_tokens", 4096);
        payload.put("stream", false);
        HttpRequest request = HttpRequest.newBuilder(URI.create(base + "/chat/completions"))
                .timeout(Duration.ofSeconds(90))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + model.getApiKey())
                .POST(HttpRequest.BodyPublishers.ofString(payload.toJSONString(), StandardCharsets.UTF_8)).build();
        HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() != 200) {
            throw new IllegalStateException("题目生成请求失败（HTTP " + response.statusCode() + "）");
        }
        JSONObject root = JSON.parseObject(response.body());
        JSONArray choices = root == null ? null : root.getJSONArray("choices");
        if (choices == null || choices.isEmpty()) {
            throw new IllegalStateException("题目生成无有效返回");
        }
        return choices.getJSONObject(0).getJSONObject("message").getString("content");
    }

    private List<JSONObject> parseQuestions(String raw) {
        List<JSONObject> items = new ArrayList<>();
        try {
            JSONObject root = JSON.parseObject(raw);
            JSONArray questions = root == null ? null : root.getJSONArray("questions");
            if (questions != null) {
                for (int i = 0; i < questions.size(); i++) {
                    JSONObject item = questions.getJSONObject(i);
                    if (item != null) {
                        items.add(item);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("扩充题目解析失败: {}", e.getMessage());
        }
        return items;
    }

    private QuestionBankDO toQuestion(String category, String skillTag, JSONObject item) {
        String questionType = item.getString("questionType");
        Object difficulty = item.get("difficulty");
        if (questionType == null || !QUESTION_TYPES.contains(questionType)
                || !(difficulty instanceof Number n) || n.intValue() < 1 || n.intValue() > 5) {
            return null;
        }
        String questionText = item.getString("questionText").trim();
        if (questionText.isBlank() || questionText.length() > 2000) {
            return null;
        }
        QuestionBankDO question = new QuestionBankDO();
        question.setCategory(category);
        question.setSkillTag(skillTag);
        question.setDifficulty(n.intValue());
        question.setQuestionType(questionType);
        question.setQuestionText(questionText);
        String answer = StrUtil.nullToEmpty(item.getString("referenceAnswer")).trim();
        question.setReferenceAnswer(answer.length() > 8000 ? answer.substring(0, 8000) : answer);
        Object points = item.get("scoringPoints");
        question.setScoringPoints(points instanceof List<?> list && !list.isEmpty()
                ? JSON.toJSONString(list) : null);
        question.setStatus(1);
        question.setSource(EXPAND_SOURCE);
        question.setDelFlag(0);
        return question;
    }

    /** 归一化题干用于查重：去空白后取前 80 字符，捕获模型复述同一考点的近似重复。 */
    private String normalizeKey(String questionText) {
        String normalized = questionText.replaceAll("\\s+", "");
        return normalized.length() > 80 ? normalized.substring(0, 80) : normalized;
    }

    private Set<String> existingQuestionKeys() {
        Set<String> keys = new HashSet<>();
        questionBankMapper.selectList(Wrappers.<QuestionBankDO>lambdaQuery()
                        .eq(QuestionBankDO::getDelFlag, 0)
                        .select(QuestionBankDO::getQuestionText))
                .forEach(q -> keys.add(normalizeKey(q.getQuestionText())));
        return keys;
    }
}
