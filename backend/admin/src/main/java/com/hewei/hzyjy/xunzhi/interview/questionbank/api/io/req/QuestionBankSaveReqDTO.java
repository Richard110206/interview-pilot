package com.hewei.hzyjy.xunzhi.interview.questionbank.api.io.req;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

/**
 * 题库新增/编辑请求DTO
 */
@Data
public class QuestionBankSaveReqDTO {

    /**
     * 编辑时必填，新增时为空
     */
    private Long id;

    /**
     * 岗位方向
     */
    @NotBlank(message = "岗位方向不能为空")
    @Size(max = 64, message = "岗位方向长度不能超过64")
    private String category;

    /**
     * 技能标签
     */
    @NotBlank(message = "技能标签不能为空")
    @Size(max = 64, message = "技能标签长度不能超过64")
    private String skillTag;

    /**
     * 难度 1-5
     */
    @NotNull(message = "难度不能为空")
    @Min(value = 1, message = "难度最小为1")
    @Max(value = 5, message = "难度最大为5")
    private Integer difficulty;

    /**
     * 题型：CONCEPT/SCENARIO/CODING/PROJECT
     */
    @NotBlank(message = "题型不能为空")
    @Size(max = 32, message = "题型长度不能超过32")
    private String questionType;

    /**
     * 题干
     */
    @NotBlank(message = "题干不能为空")
    @Size(max = 2000, message = "题干长度不能超过2000")
    private String questionText;

    /**
     * 参考答案，可为空
     */
    @Size(max = 8000, message = "参考答案长度不能超过8000")
    private String referenceAnswer;

    /**
     * 评分要点列表，服务端序列化为JSON存储
     */
    private List<String> scoringPoints;

    /**
     * 状态：0禁用 1启用
     */
    @NotNull(message = "状态不能为空")
    @Min(value = 0, message = "状态取值不正确")
    @Max(value = 1, message = "状态取值不正确")
    private Integer status;

    /**
     * 来源说明
     */
    @Size(max = 128, message = "来源说明长度不能超过128")
    private String source;
}
