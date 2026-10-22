# Java 直连 DeepSeek 的文字面试

2026-10-20 用户在上传简历时遇到 `agent binding not found for scene=interview-question-asking`，并选择用已有 DeepSeek 接通 Java 面试流程。

## 根因与修复

原项目在创建面试会话时必须先找到“面试提问官”的讯飞工作流绑定。本地仅配置了普通聊天模型，`agent_properties` 没有工作流记录，因此请求在上传前就失败。只补一个名称或虚构 flow_id 不能让后续出题和评分运行。

新增可切换的 `xunzhi-agent.interview-ai.provider` 配置。默认仍为 `xingchen`，本机 `.local/runtime.env` 设置 `XUNZHI_INTERVIEW_AI_PROVIDER=deepseek`。直连模式以 Java 代码定义出题、评分和追问三种角色，调用本地模型表中最新启用的 `deepseek` 配置。角色使用预留负数标识和 `java-deepseek:` 前缀记录来源，不假冒已导入的讯飞工作流。

没有改写整套面试业务：沿用现有会话、Redis 缓存、锁、单次请求复用、LiteFlow 追问规则、MongoDB 历史和 MySQL 报告保存。模型请求走 Java HttpClient，经原 `InterviewAiInvoker` 的保护链路。普通聊天继续使用现有 Spring AI 接入。

## 当前行为

1. 创建会话前检查真实 DeepSeek 模型配置，配置无效时不会先放弃用户原来的活动会话。
2. 上传 PDF 后，Apache PDFBox 3.0.8 在 Java 内提取文字；原 PDF 保存在私有 `.local/data/resumes`，提取文字发往配置的 DeepSeek 服务进行分析。
3. 出题角色返回问题、简历得分、建议和技能摘要。默认生成 3 道主问题，可设置 `XUNZHI_INTERVIEW_QUESTION_COUNT`，支持范围 1—10。
4. 评分角色评价具体回答，返回 0—100 分、反馈、遗漏点及追问建议；Java/LiteFlow 决定是否追问及何时进入下一题，追问角色生成具体问题。
5. JSON 输出在服务端验证；空内容、截断、分数越界或缺失字段不会作为正常评分落库。不返回供应商原始错误正文或密钥。
6. PDF 预览通过既有登录与会话归属校验接口读取；内部文件标识不能用于任意本地路径读取。刷新后可恢复简历预览、问题和会话状态。
7. `/api/xunzhi/v1/interview/capabilities` 提供当前能力，直连模式关闭页面语音输入、问题朗读和表情分析调用。摄像头可手动打开作预览，仍默认关闭。
8. 文字模式报告不展示原聚合逻辑中由缺失仪态数据补出的 0 分或推导雷达维度；仅展示简历、回答评分与明确标为估算的平均综合分。逐题反馈保留模型实际返回的评价。

支持不超过 10 MB、15 页、未加密且能提取文字的 PDF；暂未接入扫描件 OCR。语音与图像评分未完成，不能用文字模型生成虚构的声音或表情得分。

这是共用一个模型的多角色业务编排，没有新增 MCP，也不等同于多个模型自主协作完成任务。

## 本轮验证

- 前后端构建通过。本轮选取的 9 个后端测试类共 18 项通过，覆盖原绑定兼容、出题解析、面试状态／报告、直连请求、输出校验与 PDF 存取等。
- 前端简历、会话与报告 3 组共 23 项测试通过；修改文件 ESLint 通过。追加浏览器检查确认已保存的文字报告不再显示未评估的仪态维度。
- 使用独立合成账号和一页合成简历真实调用 DeepSeek，生成 3 道主问题、简历得分和建议。完成含追问的 9 轮作答，落库并恢复 `FINISHED` 状态，原 PDF 预览字节与上传内容一致。本次出题约 3.67 秒，是单次结果，不是性能指标。
- 非 PDF 文件被拒绝，会话回落到 `DRAFT`；同一 requestId 重放不重复增加总分。
- 浏览器实测上传、刷新恢复、PDF 渲染、回答评分、主动结束及报告页；未产生未支持的 TTS 或表情分析请求，无页面脚本错误。
- 其他用户访问该测试会话的 PDF 返回 HTTP 400；查询报告返回空数据，未取得报告内容。
- 本轮测试没有修改用户自己的面试记录。测试结果及截图在 `.local/direct-interview-evidence.json`、`.local/direct-ui-evidence.json` 和 `.research`，不要把测试账号、私有日志与数据库直接打包发布。

## 使用

保持现有前后端服务运行，刷新 `http://127.0.0.1:5173/interview/room`，重新上传一份可选中文字的 PDF。无须填写讯飞工作流 ID。开机后运行方式仍为根目录的 `scripts/start-dev.ps1`。

本轮是在回环地址上验证，课程指定 IP 部署仍需单独完成。正式题目和其他二开内容尚未确定。

实现所依据的官方资料：[DeepSeek JSON 输出](https://api-docs.deepseek.com/guides/json_mode/)、[DeepSeek 思考模式开关](https://api-docs.deepseek.com/guides/thinking_mode/)、[Apache PDFBox 3 加载 API](https://pdfbox.apache.org/3.0/migration.html)。
