package com.hewei.hzyjy.xunzhi.interview.knowledge.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.util.Date;
import lombok.Data;

/**
 * 知识库切块表：文档切分后的文本块，向量嵌入以块为单位。
 * @TableName knowledge_chunk
 */
@TableName(value = "knowledge_chunk")
@Data
public class KnowledgeChunkDO {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 所属文档ID
     */
    private Long documentId;

    /**
     * 块序号，从1开始
     */
    private Integer chunkSeq;
    private Integer pageStart;
    private Integer pageEnd;

    /**
     * 块所属标题（最近的小节标题）
     */
    private String heading;

    /**
     * 块文本内容
     */
    private String content;

    private Date createTime;

    private Integer delFlag;
}
