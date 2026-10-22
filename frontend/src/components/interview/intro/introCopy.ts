export type IntroHighlight = {
  title: string;
  description: string;
};

export type InterviewIntroLocale = "zh-CN" | "en-US";

type InterviewIntroCopy = {
  badge: string;
  title: string;
  description: string;
  continueButton: string;
  startButton: string;
  reviewButton: string;
  processTitle: string;
  processUpdateTitle: string;
  processUpdateDescription: string;
  highlights: IntroHighlight[];
  steps: string[];
};

const INTRO_COPY_BY_LOCALE: Record<InterviewIntroLocale, InterviewIntroCopy> = {
  "zh-CN": {
    badge: "AI 面试评估",
    title: "从项目聊起，把技术问深一层",
    description:
      "上传你的简历，围绕实际经历穿插技术八股与场景追问。结束后回看逐题评分，找到下一次值得练的地方。",
    continueButton: "继续上次面试",
    startButton: "进入面试室",
    reviewButton: "先复习题库",
    processTitle: "面试流程",
    processUpdateTitle: "本场练习：项目 × 八股 × 场景",
    processUpdateDescription:
      "从项目细节切入，关联题库中的技术原理，再回到场景应用；作答与追问也会检索相关考点。",
    highlights: [
      {
        title: "从你的项目出发",
        description: "围绕简历已写明的实践和技术选型提问",
      },
      {
        title: "八股穿插问",
        description: "把相关技术原理接在项目问题后面",
      },
      {
        title: "场景接着练",
        description: "将基础知识放回故障排查与方案取舍",
      },
      {
        title: "真题可溯源",
        description: "题库改编题保留来源，回答生成逐题反馈",
      },
    ],
    steps: [
      "上传 PDF 简历，识别项目与技术栈",
      "项目深挖、八股原理、场景应用穿插练习",
      "生成表现报告与提升建议",
    ],
  },
  "en-US": {
    badge: "AI interview evaluation",
    title: "Review your interview performance with a clean, guided flow",
    description:
      "Start from resume analysis, continue with question-by-question practice, and finish with a report that keeps your session state isolated and recoverable.",
    continueButton: "Continue last interview",
    startButton: "Enter interview room",
    reviewButton: "Review question bank",
    processTitle: "Interview flow",
    processUpdateTitle: "Dual-source retrieval",
    processUpdateDescription:
      "Questions draw on both the question bank and the knowledge base, traceable to bank IDs.",
    highlights: [
      {
        title: "Resume score",
        description:
          "Multi-dimensional scoring based on role and capability models",
      },
      {
        title: "Answer score",
        description:
          "Evaluate logic, structure, depth, and expression together",
      },
      {
        title: "Capability radar",
        description:
          "Technical depth, communication, projects, and live response",
      },
      {
        title: "Traceable questions",
        description: "Each question cites its bank source and reference answer",
      },
    ],
    steps: [
      "Upload your resume and target role",
      "Enter the room and answer AI-guided questions",
      "Receive a report with actionable suggestions",
    ],
  },
};

export const DEFAULT_INTERVIEW_INTRO_LOCALE: InterviewIntroLocale = "zh-CN";

export const getInterviewIntroCopy = (
  locale: InterviewIntroLocale = DEFAULT_INTERVIEW_INTRO_LOCALE,
) => {
  return INTRO_COPY_BY_LOCALE[locale] ?? INTRO_COPY_BY_LOCALE["zh-CN"];
};
