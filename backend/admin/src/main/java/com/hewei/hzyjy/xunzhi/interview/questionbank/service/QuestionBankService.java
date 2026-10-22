package com.hewei.hzyjy.xunzhi.interview.questionbank.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.hewei.hzyjy.xunzhi.interview.questionbank.api.io.req.QuestionBankPageReqDTO;
import com.hewei.hzyjy.xunzhi.interview.questionbank.api.io.req.QuestionBankSaveReqDTO;
import com.hewei.hzyjy.xunzhi.interview.questionbank.api.io.resp.QuestionBankRespDTO;
import com.hewei.hzyjy.xunzhi.interview.questionbank.rag.QuestionBankRagService.QuestionBankHit;
import java.util.List;
import java.util.Map;

/**
 * 题库服务：CRUD 与向量索引联动。
 */
public interface QuestionBankService {

    /**
     * 新增或编辑题目，成功后同步向量索引
     */
    Long saveOrUpdateQuestion(QuestionBankSaveReqDTO reqDTO);

    /**
     * 分页查询
     */
    IPage<QuestionBankRespDTO> pageQuestions(QuestionBankPageReqDTO reqDTO);

    /**
     * 查询单题
     */
    QuestionBankRespDTO getQuestion(Long id);

    /**
     * 启用/禁用题目并同步向量索引
     */
    void updateStatus(Long id, Integer status);

    /**
     * 逻辑删除题目并移除向量
     */
    void deleteQuestion(Long id);

    /**
     * 语义检索相关真题（验证与演示用）
     */
    List<QuestionBankHit> searchQuestions(String query, Integer topK);

    /**
     * 全量重建向量索引，返回索引条数
     */
    int rebuildIndex();

    /**
     * 按岗位方向统计启用题目数量
     */
    Map<String, Long> countByCategory();

    /**
     * 按技能标签统计启用题目数量
     */
    Map<String, Long> countBySkillTag(String category);
}
