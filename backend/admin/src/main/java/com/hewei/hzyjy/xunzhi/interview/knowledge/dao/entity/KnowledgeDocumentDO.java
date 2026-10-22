package com.hewei.hzyjy.xunzhi.interview.knowledge.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.util.Date;
import lombok.Data;

/**
 * 知识库文档表
 * @TableName knowledge_document
 */
@TableName(value = "knowledge_document")
@Data
public class KnowledgeDocumentDO {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 文档标题
     */
    private String title;

    /**
     * 来源文件名
     */
    private String fileName;

    /**
     * 分类：网络/操作系统/面经等
     */
    private String category;

    /**
     * PDF页数
     */
    private Integer pageCount;

    /**
     * 切分块数
     */
    private Integer chunkCount;

    /**
     * 状态：0禁用 1启用
     */
    private Integer status;

    /**
     * 来源与版权说明
     */
    private String sourceNote;

    private Date createTime;

    private Date updateTime;

    private Integer delFlag;
}
