export const MARKETING_HERO_VIDEO_SRC = "/videos/home-bg.mp4";
export const MARKETING_PROJECT_DEMO_VIDEO_SRC = "/videos/yingda-demo.mp4";

export const MARKETING_TEXT = {
  heroTitle: "映答",
  heroSubtitle:
    "检索增强的 AI 模拟面试：真题题库与知识库双源驱动，按你的简历出题、追问、评分、出报告。",
  startNow: "马上面试",
  secondaryAction: "逛逛题库",
  projectDemoTitle: "真实系统演示",
  projectDemoSubtitle:
    "从题库与知识检索，到上传简历、项目追问、过程轨迹和报告复盘，跟着一次实际操作开始练习。",
  advantagesTitle: "平台优势",
  workflowTitle: "使用流程",
  outcomeTitle: "你将获得",
  statsTitle: "数据一览",
} as const;

export const MARKETING_STATS = [
  { value: "60", label: "精选真题" },
  { value: "1,693", label: "知识块向量化" },
  { value: "3", label: "八股文/面经文档" },
  { value: "8", label: "技能方向覆盖" },
] as const;

export const MARKETING_ADVANTAGES = [
  {
    icon: "search",
    title: "检索增强出题",
    description:
      "出题前先从题库与知识库做向量检索，真题改编、题目可溯源到题库编号，不凭空编题。",
  },
  {
    icon: "knowledge",
    title: "双源知识库",
    description:
      "MySQL 题库与 PDF 知识文档（八股文、面经）分别切块向量化，出题时双路召回。",
  },
  {
    icon: "globe",
    title: "联网扩充题库",
    description:
      "按技能标签联网检索真实面经材料，模型编写题目并自动查重、入库、向量化。",
  },
  {
    icon: "report",
    title: "可复盘的面试报告",
    description:
      "逐题评分与追问建议自动沉淀为报告，每道题都标注参考来源，复盘有据可依。",
  },
] as const;

export const MARKETING_WORKFLOW = [
  "上传简历，AI 检索匹配真题与知识要点",
  "进入面试室，按简历经历定制问题与追问",
  "逐题作答，实时获得评分与缺漏反馈",
  "生成面试报告，对照评分要点复盘提升",
] as const;

export const MARKETING_OUTCOMES = [
  "清晰的逐题评分与改进建议",
  "可溯源的出题依据与参考答案",
  "针对薄弱知识点的持续训练",
  "跨场次的能力对比与成长轨迹",
] as const;
