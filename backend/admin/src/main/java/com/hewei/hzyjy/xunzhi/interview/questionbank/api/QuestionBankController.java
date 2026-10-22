package com.hewei.hzyjy.xunzhi.interview.questionbank.api;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.hewei.hzyjy.xunzhi.common.convention.annotation.CurrentUser;
import com.hewei.hzyjy.xunzhi.common.convention.context.UserContext;
import com.hewei.hzyjy.xunzhi.common.convention.result.Result;
import com.hewei.hzyjy.xunzhi.common.convention.result.Results;
import com.hewei.hzyjy.xunzhi.interview.questionbank.api.io.req.QuestionBankPageReqDTO;
import com.hewei.hzyjy.xunzhi.interview.questionbank.api.io.req.QuestionBankSaveReqDTO;
import com.hewei.hzyjy.xunzhi.interview.questionbank.api.io.resp.QuestionBankRespDTO;
import com.hewei.hzyjy.xunzhi.interview.questionbank.expand.QuestionBankExpandReqDTO;
import com.hewei.hzyjy.xunzhi.interview.questionbank.expand.QuestionBankExpansionService;
import com.hewei.hzyjy.xunzhi.interview.questionbank.rag.QuestionBankRagService.QuestionBankHit;
import com.hewei.hzyjy.xunzhi.interview.questionbank.service.QuestionBankService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 题库管理接口：CRUD、语义检索与向量索引运维。
 */
@RestController
@RequestMapping("/api/xunzhi/v1/interview/question-bank")
@RequiredArgsConstructor
public class QuestionBankController {

    private final QuestionBankService questionBankService;
    private final QuestionBankExpansionService questionBankExpansionService;

    /**
     * 联网扩充题库：按技能标签检索真实面经/招聘材料，由模型编写题目，查重后入库并自动向量化。
     */
    @PostMapping("/expand")
    public Result<QuestionBankExpansionService.ExpansionResult> expandQuestionBank(
            @Valid @RequestBody QuestionBankExpandReqDTO requestParam,
            @CurrentUser UserContext currentUser) {
        return Results.success(questionBankExpansionService.expand(requestParam));
    }

    @PostMapping
    public Result<Long> saveOrUpdateQuestion(
            @Valid @RequestBody QuestionBankSaveReqDTO requestParam,
            @CurrentUser UserContext currentUser) {
        return Results.success(questionBankService.saveOrUpdateQuestion(requestParam));
    }

    @GetMapping("/page")
    public Result<IPage<QuestionBankRespDTO>> pageQuestions(
            QuestionBankPageReqDTO requestParam,
            @CurrentUser UserContext currentUser) {
        return Results.success(questionBankService.pageQuestions(requestParam));
    }

    @GetMapping("/{id}")
    public Result<QuestionBankRespDTO> getQuestion(
            @PathVariable Long id,
            @CurrentUser UserContext currentUser) {
        return Results.success(questionBankService.getQuestion(id));
    }

    @PostMapping("/{id}/status")
    public Result<Void> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body,
            @CurrentUser UserContext currentUser) {
        questionBankService.updateStatus(id, body == null ? null : body.get("status"));
        return Results.success();
    }

    @PostMapping("/{id}/delete")
    public Result<Void> deleteQuestion(
            @PathVariable Long id,
            @CurrentUser UserContext currentUser) {
        questionBankService.deleteQuestion(id);
        return Results.success();
    }

    @GetMapping("/search")
    public Result<List<QuestionBankHit>> searchQuestions(
            @RequestParam String query,
            @RequestParam(required = false) Integer topK,
            @CurrentUser UserContext currentUser) {
        return Results.success(questionBankService.searchQuestions(query, topK));
    }

    @PostMapping("/rebuild-index")
    public Result<Integer> rebuildIndex(@CurrentUser UserContext currentUser) {
        return Results.success(questionBankService.rebuildIndex());
    }

    @GetMapping("/categories")
    public Result<Map<String, Long>> countByCategory(@CurrentUser UserContext currentUser) {
        return Results.success(questionBankService.countByCategory());
    }

    @GetMapping("/skill-tags")
    public Result<Map<String, Long>> countBySkillTag(@RequestParam(required = false) String category,
                                                    @CurrentUser UserContext currentUser) {
        return Results.success(questionBankService.countBySkillTag(category));
    }
}
