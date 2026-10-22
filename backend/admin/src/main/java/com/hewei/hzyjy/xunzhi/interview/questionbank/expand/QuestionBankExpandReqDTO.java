package com.hewei.hzyjy.xunzhi.interview.questionbank.expand;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 题库联网扩充请求DTO
 */
@Data
public class QuestionBankExpandReqDTO {

    /**
     * 岗位方向，如 Java后端
     */
    @NotBlank(message = "岗位方向不能为空")
    @Size(max = 64)
    private String category;

    /**
     * 技能标签，作为搜索主题，如 并发/JVM/Spring/MySQL/Redis/网络
     */
    @NotBlank(message = "技能标签不能为空")
    @Size(max = 64)
    private String skillTag;

    /**
     * 本次生成题目数量 1-10
     */
    @Min(value = 1, message = "生成数量最小为1")
    @Max(value = 10, message = "生成数量最大为10")
    private Integer count = 5;
}
