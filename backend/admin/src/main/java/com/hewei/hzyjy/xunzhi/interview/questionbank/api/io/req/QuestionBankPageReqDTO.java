package com.hewei.hzyjy.xunzhi.interview.questionbank.api.io.req;

import lombok.Data;

/**
 * 题库分页查询请求DTO
 */
@Data
public class QuestionBankPageReqDTO {

    /**
     * 当前页码
     */
    private Integer pageNum = 1;

    /**
     * 每页数量
     */
    private Integer pageSize = 10;

    /**
     * 岗位方向（可选）
     */
    private String category;

    /**
     * 技能标签（可选）
     */
    private String skillTag;

    /**
     * 难度（可选）
     */
    private Integer difficulty;

    /**
     * 状态（可选）
     */
    private Integer status;

    /**
     * 题干关键词（可选）
     */
    private String keyword;
}
