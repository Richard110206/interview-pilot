package com.hewei.hzyjy.xunzhi.interview.questionbank.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.util.Date;
import lombok.Data;

/**
 * 面试题库表
 * @TableName question_bank
 */
@TableName(value = "question_bank")
@Data
public class QuestionBankDO {

    /**
     * ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 岗位方向，如 Java后端
     */
    private String category;

    /**
     * 技能标签，如 集合/并发/JVM/Spring/MySQL/Redis/网络
     */
    private String skillTag;

    /**
     * 难度：1容易 2一般 3中等 4较难 5困难
     */
    private Integer difficulty;

    /**
     * 题型：CONCEPT概念 SCENARIO场景 CODING编码 PROJECT项目
     */
    private String questionType;

    /**
     * 题干
     */
    private String questionText;

    /**
     * 参考答案
     */
    private String referenceAnswer;

    /**
     * 评分要点JSON数组文本
     */
    private String scoringPoints;

    /**
     * 状态：0禁用 1启用
     */
    private Integer status;

    /**
     * 来源说明
     */
    private String source;

    /**
     * 创建时间
     */
    private Date createTime;

    /**
     * 修改时间
     */
    private Date updateTime;

    /**
     * 删除标识 0：未删除 1：已删除
     */
    private Integer delFlag;
}
