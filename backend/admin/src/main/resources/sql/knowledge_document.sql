-- 知识库文档与切块表：PDF 提取→结构化切分→向量嵌入的第二数据源。
create table knowledge_document
(
    id          bigint auto_increment comment '主键ID'
        primary key,
    title       varchar(256)                        not null comment '文档标题',
    file_name   varchar(256)                        not null comment '来源文件名',
    category    varchar(64)                         null comment '分类：网络/操作系统/面经等',
    page_count  int                                 null comment 'PDF页数',
    chunk_count int        default 0                not null comment '切分块数',
    status      tinyint    default 1                not null comment '状态：0禁用 1启用',
    source_note varchar(256)                        null comment '来源与版权说明',
    create_time datetime default CURRENT_TIMESTAMP  null comment '创建时间',
    update_time datetime default CURRENT_TIMESTAMP  null on update CURRENT_TIMESTAMP comment '更新时间',
    del_flag    tinyint  default 0                  not null comment '删除标记：0未删除 1已删除'
)
    comment '知识库文档表' collate = utf8mb4_unicode_ci;

create index idx_knowledge_document_category
    on knowledge_document (category);

create table knowledge_chunk
(
    id          bigint auto_increment comment '主键ID'
        primary key,
    document_id bigint                               not null comment '所属文档ID',
    chunk_seq   int                                  not null comment '块序号，从1开始',
    page_start  int                                  null comment 'PDF起始页（从1开始）',
    page_end    int                                  null comment 'PDF结束页',
    heading     varchar(512)                         null comment '块所属标题（最近的小节标题）',
    content     text                                 not null comment '块文本内容',
    create_time datetime default CURRENT_TIMESTAMP   null comment '创建时间',
    del_flag    tinyint  default 0                   not null comment '删除标记：0未删除 1已删除',
    constraint uk_knowledge_chunk_doc_seq unique (document_id, chunk_seq)
)
    comment '知识库切块表' collate = utf8mb4_unicode_ci;

create index idx_knowledge_chunk_document
    on knowledge_chunk (document_id);
