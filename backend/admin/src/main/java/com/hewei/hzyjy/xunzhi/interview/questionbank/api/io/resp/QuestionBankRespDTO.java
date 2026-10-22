package com.hewei.hzyjy.xunzhi.interview.questionbank.api.io.resp;

import java.util.Date;
import java.util.List;
import lombok.Data;

/**
 * 题库响应DTO
 */
@Data
public class QuestionBankRespDTO {

    private Long id;

    private String category;

    private String skillTag;

    private Integer difficulty;

    private String questionType;

    private String questionText;

    private String referenceAnswer;

    private List<String> scoringPoints;

    private Integer status;

    private String source;

    private Date createTime;

    private Date updateTime;
}
